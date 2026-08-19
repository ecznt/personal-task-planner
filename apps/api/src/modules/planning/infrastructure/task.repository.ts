import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Task, TaskDetail, TaskSummary } from '../domain/task.entity';

@Injectable()
export class TaskRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createTask(
    userId: string,
    areaId: string,
    input: {
      readonly title: string;
      readonly description: string | null;
      readonly plannedAt: Date | null;
      readonly dueAt: Date | null;
      readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
    },
    defaultStatusId: string,
  ): Promise<Task> {
    return this.prisma.$transaction(async (transaction) => {
      const maxRank = await transaction.task.findFirst({
        where: { userId, areaId, lifecycleState: 'ACTIVE' },
        orderBy: { areaRank: 'desc' },
        select: { areaRank: true },
      });

      const nextAreaRank = maxRank ? incrementRank(maxRank.areaRank) : '000000000000000000000001';

      const maxGlobalRank = await transaction.task.findFirst({
        where: { userId, lifecycleState: 'ACTIVE' },
        orderBy: { globalRank: 'desc' },
        select: { globalRank: true },
      });

      const nextGlobalRank = maxGlobalRank
        ? incrementRank(maxGlobalRank.globalRank)
        : '000000000000000000000001';

      const task = await transaction.task.create({
        data: {
          userId,
          areaId,
          areaStatusId: defaultStatusId,
          title: input.title,
          description: input.description,
          plannedAt: input.plannedAt,
          dueAt: input.dueAt,
          priority: input.priority,
          globalRank: nextGlobalRank,
          areaRank: nextAreaRank,
        },
      });

      return task;
    });
  }

  async findDefaultToDoStatus(userId: string, areaId: string): Promise<{ id: string } | null> {
    return this.prisma.areaStatus.findFirst({
      where: { userId, areaId, canonicalStatus: 'TO_DO', isDefault: true, active: true },
      select: { id: true },
    });
  }

  async findById(userId: string, taskId: string): Promise<TaskDetail | null> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
    });

    if (!task) {
      return null;
    }

    const areaStatus = await this.prisma.areaStatus.findUnique({
      where: { id: task.areaStatusId },
      select: { canonicalStatus: true },
    });

    const area = await this.prisma.area.findUnique({
      where: { id: task.areaId },
      select: { name: true },
    });

    return {
      task,
      canonicalStatus: areaStatus?.canonicalStatus ?? 'TO_DO',
      areaName: area?.name ?? '',
    };
  }

  async listByArea(
    userId: string,
    areaId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ tasks: readonly TaskSummary[]; nextCursor?: string }> {
    const tasks = await this.prisma.task.findMany({
      where: { userId, areaId, lifecycleState: 'ACTIVE' },
      orderBy: { areaRank: 'asc' },
      take: limit + 1,
      ...(cursor !== undefined && { cursor: { id: cursor } }),
      include: { areaStatus: { select: { canonicalStatus: true } } },
    });

    const hasMore = tasks.length > limit;
    const lastFetched = hasMore ? tasks.at(limit) : undefined;
    const nextCursor = lastFetched?.id;
    const slicedTasks = tasks.slice(0, limit);

    const summaries: TaskSummary[] = slicedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      canonicalStatus: task.areaStatus.canonicalStatus,
      dueAt: task.dueAt,
      plannedAt: task.plannedAt,
      lifecycleState: task.lifecycleState,
    }));

    return { tasks: summaries, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async updateTask(
    userId: string,
    taskId: string,
    input: {
      readonly title: string | undefined;
      readonly description: string | null | undefined;
      readonly plannedAt: Date | null | undefined;
      readonly dueAt: Date | null | undefined;
      readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | undefined;
      readonly areaStatusId: string | undefined;
    },
    version: number,
  ): Promise<Task | null> {
    const data: Record<string, unknown> = { version: { increment: 1 } };

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.plannedAt !== undefined) {
      data.plannedAt = input.plannedAt;
    }

    if (input.dueAt !== undefined) {
      data.dueAt = input.dueAt;
    }

    if (input.priority !== undefined) {
      data.priority = input.priority;
    }

    if (input.areaStatusId !== undefined) {
      data.areaStatusId = input.areaStatusId;
    }

    const result = await this.prisma.task.updateMany({
      where: { id: taskId, userId, version, lifecycleState: 'ACTIVE' },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    return task;
  }

  async areaExists(userId: string, areaId: string): Promise<boolean> {
    const area = await this.prisma.area.findFirst({
      where: { id: areaId, userId, lifecycleState: 'ACTIVE' },
      select: { id: true },
    });
    return area !== null;
  }

  async areaStatusBelongsToArea(
    userId: string,
    areaId: string,
    areaStatusId: string,
  ): Promise<boolean> {
    const status = await this.prisma.areaStatus.findFirst({
      where: { id: areaStatusId, userId, areaId, active: true },
      select: { id: true },
    });
    return status !== null;
  }
}

function incrementRank(rank: string): string {
  const num = BigInt(rank) + 1000n;
  return num.toString().padStart(24, '0');
}
