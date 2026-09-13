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
    options?: { readonly isInbox?: boolean },
  ): Promise<{ area: Area; statuses: readonly AreaStatus[] }> {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.create({
        data: {
          name,
          normalizedName,
          userId,
          isInbox: options?.isInbox ?? false,
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

  async findInbox(userId: string): Promise<Area | null> {
    return this.prisma.area.findFirst({
      where: { userId, isInbox: true, lifecycleState: 'ACTIVE' },
    });
  }

  async ensureInbox(userId: string): Promise<Area> {
    const existing = await this.findInbox(userId);

    if (existing) {
      return existing;
    }

    const { area } = await this.createArea(userId, 'Gelen Kutusu', 'gelen kutusu', {
      isInbox: true,
    });
    return area;
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
          isInbox: area.isInbox,
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

  async createStatus(
    userId: string,
    areaId: string,
    name: string,
    normalizedName: string,
    canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
  ): Promise<
    { status: AreaStatus; areaVersion: number } | { error: 'NOT_FOUND' | 'DUPLICATE_NAME' }
  > {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.findFirst({
        where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!area) {
        return { error: 'NOT_FOUND' as const };
      }

      const existing = await transaction.areaStatus.findFirst({
        where: { areaId, normalizedName },
        select: { id: true },
      });

      if (existing) {
        return { error: 'DUPLICATE_NAME' as const };
      }

      const maxPosition = await transaction.areaStatus.findFirst({
        where: { areaId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      const nextPosition = (maxPosition?.position ?? 0) + 1;

      const status = await transaction.areaStatus.create({
        data: {
          userId,
          areaId,
          name,
          normalizedName,
          canonicalStatus,
          position: nextPosition,
          isDefault: false,
        },
      });

      await transaction.area.update({
        where: { id: areaId },
        data: { version: { increment: 1 } },
      });

      const updatedArea = await transaction.area.findUnique({ where: { id: areaId } });
      if (updatedArea === null) {
        throw new Error('Area disappeared during workflow update');
      }

      return { status, areaVersion: updatedArea.version };
    });
  }

  async updateStatusName(
    userId: string,
    areaId: string,
    statusId: string,
    name: string,
    normalizedName: string,
    version: number,
  ): Promise<
    | { status: AreaStatus; areaVersion: number }
    | { error: 'NOT_FOUND' | 'STALE_VERSION' | 'DUPLICATE_NAME' | 'CANNOT_RENAME_DEFAULT' }
  > {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.findFirst({
        where: { id: areaId, userId, version, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!area) {
        const existing = await transaction.area.findFirst({
          where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
          select: { id: true },
        });
        return { error: existing ? ('STALE_VERSION' as const) : ('NOT_FOUND' as const) };
      }

      const status = await transaction.areaStatus.findFirst({
        where: { id: statusId, areaId, userId },
      });

      if (!status) {
        return { error: 'NOT_FOUND' as const };
      }

      if (status.isDefault) {
        return { error: 'CANNOT_RENAME_DEFAULT' as const };
      }

      const duplicate = await transaction.areaStatus.findFirst({
        where: { areaId, normalizedName, id: { not: statusId } },
        select: { id: true },
      });

      if (duplicate) {
        return { error: 'DUPLICATE_NAME' as const };
      }

      await transaction.areaStatus.update({
        where: { id: statusId },
        data: { name, normalizedName },
      });

      await transaction.area.update({
        where: { id: areaId },
        data: { version: { increment: 1 } },
      });

      const updatedArea = await transaction.area.findUnique({ where: { id: areaId } });
      if (updatedArea === null) {
        throw new Error('Area disappeared during workflow update');
      }

      return { status: { ...status, name, normalizedName }, areaVersion: updatedArea.version };
    });
  }

  async retireStatus(
    userId: string,
    areaId: string,
    statusId: string,
    version: number,
  ): Promise<
    | { areaVersion: number; migratedCount: number }
    | { error: 'NOT_FOUND' | 'STALE_VERSION' | 'CANNOT_RETIRE_DEFAULT' }
  > {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.findFirst({
        where: { id: areaId, userId, version, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!area) {
        const existing = await transaction.area.findFirst({
          where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
          select: { id: true },
        });
        return { error: existing ? ('STALE_VERSION' as const) : ('NOT_FOUND' as const) };
      }

      const status = await transaction.areaStatus.findFirst({
        where: { id: statusId, areaId, userId },
      });

      if (!status) {
        return { error: 'NOT_FOUND' as const };
      }

      if (status.isDefault) {
        return { error: 'CANNOT_RETIRE_DEFAULT' as const };
      }

      const defaultStatus = await transaction.areaStatus.findFirst({
        where: { areaId, canonicalStatus: status.canonicalStatus, isDefault: true, active: true },
        select: { id: true },
      });

      let migratedCount = 0;

      if (defaultStatus) {
        const result = await transaction.task.updateMany({
          where: { areaStatusId: statusId, lifecycleState: 'ACTIVE' },
          data: { areaStatusId: defaultStatus.id },
        });
        migratedCount = result.count;
      }

      await transaction.areaStatus.update({
        where: { id: statusId },
        data: { active: false },
      });

      await transaction.area.update({
        where: { id: areaId },
        data: { version: { increment: 1 } },
      });

      const updatedArea = await transaction.area.findUnique({ where: { id: areaId } });
      if (updatedArea === null) {
        throw new Error('Area disappeared during workflow update');
      }

      return { areaVersion: updatedArea.version, migratedCount };
    });
  }

  async activateStatus(
    userId: string,
    areaId: string,
    statusId: string,
    version: number,
  ): Promise<{ areaVersion: number } | { error: 'NOT_FOUND' | 'STALE_VERSION' }> {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.findFirst({
        where: { id: areaId, userId, version, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!area) {
        const existing = await transaction.area.findFirst({
          where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
          select: { id: true },
        });
        return { error: existing ? ('STALE_VERSION' as const) : ('NOT_FOUND' as const) };
      }

      const status = await transaction.areaStatus.findFirst({
        where: { id: statusId, areaId, userId },
        select: { id: true },
      });

      if (!status) {
        return { error: 'NOT_FOUND' as const };
      }

      await transaction.areaStatus.update({
        where: { id: statusId },
        data: { active: true },
      });

      await transaction.area.update({
        where: { id: areaId },
        data: { version: { increment: 1 } },
      });

      const updatedArea = await transaction.area.findUnique({ where: { id: areaId } });
      if (updatedArea === null) {
        throw new Error('Area disappeared during workflow update');
      }

      return { areaVersion: updatedArea.version };
    });
  }

  async reorderStatuses(
    userId: string,
    areaId: string,
    orderedStatusIds: readonly string[],
    version: number,
  ): Promise<
    { areaVersion: number } | { error: 'NOT_FOUND' | 'STALE_VERSION' | 'VALIDATION_ERROR' }
  > {
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.area.findFirst({
        where: { id: areaId, userId, version, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!area) {
        const existing = await transaction.area.findFirst({
          where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
          select: { id: true },
        });
        return { error: existing ? ('STALE_VERSION' as const) : ('NOT_FOUND' as const) };
      }

      const statuses = await transaction.areaStatus.findMany({
        where: { areaId },
        select: { id: true },
      });

      const statusIds = new Set(statuses.map((s) => s.id));

      for (const id of orderedStatusIds) {
        if (!statusIds.has(id)) {
          return { error: 'VALIDATION_ERROR' as const };
        }
      }

      if (orderedStatusIds.length !== statuses.length) {
        return { error: 'VALIDATION_ERROR' as const };
      }

      const tempBase = 10000;

      const idArray = [...orderedStatusIds];

      for (const [i, id] of idArray.entries()) {
        await transaction.areaStatus.update({
          where: { id },
          data: { position: tempBase + i },
        });
      }

      for (const [i, id] of idArray.entries()) {
        await transaction.areaStatus.update({
          where: { id },
          data: { position: i + 1 },
        });
      }

      await transaction.area.update({
        where: { id: areaId },
        data: { version: { increment: 1 } },
      });

      const updatedArea = await transaction.area.findUnique({ where: { id: areaId } });
      if (updatedArea === null) {
        throw new Error('Area disappeared during workflow update');
      }

      return { areaVersion: updatedArea.version };
    });
  }
}
