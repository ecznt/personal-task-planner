import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Area, AreaStatus, AreaSummary, AreaDetail } from '../domain/area.entity';

type CreateAreaStatusInput = {
  readonly areaId: string;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly isDefault: boolean;
  readonly name: string;
  readonly normalizedName: string;
  readonly position: number;
  readonly userId: string;
};

@Injectable()
export class AreaRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createArea(
    userId: string,
    name: string,
    normalizedName: string,
  ): Promise<{ area: Area; statuses: readonly AreaStatus[] }> {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.create({
        data: {
          name,
          normalizedName,
          userId,
        },
      });

      const defaultStatuses: CreateAreaStatusInput[] = [
        {
          areaId: area.id,
          canonicalStatus: 'TO_DO',
          isDefault: true,
          name: 'Yapılacak',
          normalizedName: 'yapilacak',
          position: 1,
          userId,
        },
        {
          areaId: area.id,
          canonicalStatus: 'IN_PROGRESS',
          isDefault: true,
          name: 'Devam Ediyor',
          normalizedName: 'devam ediyor',
          position: 2,
          userId,
        },
        {
          areaId: area.id,
          canonicalStatus: 'COMPLETED',
          isDefault: true,
          name: 'Tamamlandı',
          normalizedName: 'tamamlandi',
          position: 3,
          userId,
        },
      ];

      const statuses = await Promise.all(
        defaultStatuses.map((status) => transaction.areaStatus.create({ data: status })),
      );

      return { area, statuses };
    });
  }

  async findById(userId: string, areaId: string): Promise<AreaDetail | null> {
    const area = await this.prisma.area.findFirst({
      where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
    });

    if (!area) {
      return null;
    }

    const statuses = await this.prisma.areaStatus.findMany({
      where: { areaId, active: true },
      orderBy: { position: 'asc' },
    });

    const taskCount = await this.prisma.task.count({
      where: { areaId, userId, lifecycleState: 'ACTIVE' },
    });

    const projectCount = await this.prisma.project.count({
      where: { areaId, userId, lifecycleState: 'ACTIVE' },
    });

    return { area, statuses, taskCount, projectCount };
  }

  async listByUser(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ areas: readonly AreaSummary[]; nextCursor?: string }> {
    const areas = await this.prisma.area.findMany({
      where: { userId, lifecycleState: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(cursor !== undefined && { cursor: { id: cursor } }),
    });

    const hasMore = areas.length > limit;
    const lastFetched = hasMore ? areas.at(limit) : undefined;
    const nextCursor = lastFetched?.id;
    const slicedAreas = areas.slice(0, limit);

    const summaries: AreaSummary[] = await Promise.all(
      slicedAreas.map(async (area) => {
        const taskCount = await this.prisma.task.count({
          where: { areaId: area.id, userId, lifecycleState: 'ACTIVE' },
        });

        const projectCount = await this.prisma.project.count({
          where: { areaId: area.id, userId, lifecycleState: 'ACTIVE' },
        });

        const overdueTaskCount = await this.prisma.task.count({
          where: {
            areaId: area.id,
            userId,
            lifecycleState: 'ACTIVE',
            dueAt: { lt: new Date() },
          },
        });

        return {
          id: area.id,
          name: area.name,
          lifecycleState: area.lifecycleState,
          taskCount,
          projectCount,
          overdueTaskCount,
        };
      }),
    );

    return { areas: summaries, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async updateName(
    userId: string,
    areaId: string,
    name: string,
    normalizedName: string,
    version: number,
  ): Promise<Area | null> {
    const result = await this.prisma.area.updateMany({
      where: { id: areaId, userId, version, lifecycleState: 'ACTIVE' },
      data: { name, normalizedName, version: { increment: 1 } },
    });

    if (result.count === 0) {
      return null;
    }

    const area = await this.prisma.area.findUnique({ where: { id: areaId } });
    return area;
  }
}
