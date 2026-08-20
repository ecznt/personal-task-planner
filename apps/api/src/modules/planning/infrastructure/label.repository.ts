import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Label, LabelDetail, LabelSummary } from '../domain/label.entity';

@Injectable()
export class LabelRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createLabel(userId: string, name: string, normalizedName: string): Promise<Label> {
    return this.prisma.label.create({
      data: { userId, name, normalizedName },
    });
  }

  async findByName(userId: string, normalizedName: string): Promise<Label | null> {
    return this.prisma.label.findUnique({
      where: { userId_normalizedName: { userId, normalizedName } },
    });
  }

  async findById(userId: string, labelId: string): Promise<LabelDetail | null> {
    const label = await this.prisma.label.findFirst({
      where: { id: labelId, userId },
    });

    if (!label) {
      return null;
    }

    return { label };
  }

  async listByUser(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ labels: readonly LabelSummary[]; nextCursor?: string }> {
    const labels = await this.prisma.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      take: limit + 1,
      ...(cursor !== undefined && { cursor: { id: cursor } }),
    });

    const hasMore = labels.length > limit;
    const lastFetched = hasMore ? labels.at(limit) : undefined;
    const nextCursor = lastFetched?.id;
    const slicedLabels = labels.slice(0, limit);

    const summaries: LabelSummary[] = slicedLabels.map((label) => ({
      id: label.id,
      name: label.name,
    }));

    return { labels: summaries, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async updateName(
    userId: string,
    labelId: string,
    name: string,
    normalizedName: string,
    version: number,
  ): Promise<Label | null> {
    const result = await this.prisma.label.updateMany({
      where: { id: labelId, userId, version },
      data: { name, normalizedName, version: { increment: 1 } },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.label.findUnique({ where: { id: labelId } });
  }

  async delete(userId: string, labelId: string, version: number): Promise<boolean> {
    const result = await this.prisma.label.deleteMany({
      where: { id: labelId, userId, version },
    });

    return result.count > 0;
  }

  async findVersion(userId: string, labelId: string): Promise<number | null> {
    const label = await this.prisma.label.findFirst({
      where: { id: labelId, userId },
      select: { version: true },
    });

    return label?.version ?? null;
  }
}
