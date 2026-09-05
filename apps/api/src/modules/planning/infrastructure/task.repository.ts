import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { RecurrenceSeriesDetail, Task, TaskDetail, TaskSummary } from '../domain/task.entity';

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

    const taskLabels = await this.prisma.taskLabel.findMany({
      where: { taskId, userId },
      include: { label: { select: { id: true, name: true } } },
    });

    const checklistItems = await this.prisma.checklistItem.findMany({
      where: { taskId, userId },
      orderBy: { position: 'asc' },
    });

    let recurrence: RecurrenceSeriesDetail | null = null;

    if (task.recurrenceSeriesId) {
      const series = await this.prisma.recurrenceSeries.findFirst({
        where: { id: task.recurrenceSeriesId, userId },
      });

      if (series) {
        const activeRule = await this.prisma.recurrenceRuleVersion.findFirst({
          where: { id: series.activeRuleVersionId },
        });

        if (activeRule) {
          recurrence = {
            series,
            activeRule,
            currentOpenTaskId: series.currentOpenTaskId,
          };
        }
      }
    }

    return {
      task,
      canonicalStatus: areaStatus?.canonicalStatus ?? 'TO_DO',
      areaName: area?.name ?? '',
      labels: taskLabels.map((tl) => ({ id: tl.label.id, name: tl.label.name })),
      checklistItems,
      recurrence,
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
      version: task.version,
      areaId: task.areaId,
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
      readonly projectId: string | null | undefined;
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

    if (input.projectId !== undefined) {
      data.projectId = input.projectId;
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

  async getCanonicalStatus(
    userId: string,
    areaStatusId: string,
  ): Promise<'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' | null> {
    const status = await this.prisma.areaStatus.findFirst({
      where: { id: areaStatusId, userId, active: true },
      select: { canonicalStatus: true },
    });
    return status?.canonicalStatus ?? null;
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

  async projectBelongsToArea(userId: string, projectId: string, areaId: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, areaId, lifecycleState: 'ACTIVE' },
      select: { id: true },
    });
    return project !== null;
  }

  async incrementVersion(userId: string, taskId: string): Promise<Task | null> {
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      data: { version: { increment: 1 } },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.task.findUnique({ where: { id: taskId } });
  }

  async listGlobal(
    userId: string,
    options: {
      readonly cursor?: string;
      readonly limit: number;
      readonly sort: string;
      readonly order: 'asc' | 'desc';
      readonly areaId?: string;
      readonly projectId?: string;
      readonly priority?: string;
      readonly canonicalStatus?: string;
      readonly labelId?: string;
    },
  ): Promise<{ tasks: readonly TaskSummary[]; nextCursor?: string }> {
    const orderBy = buildGlobalSort(options.sort, options.order);

    const where: Record<string, unknown> = {
      userId,
      lifecycleState: 'ACTIVE',
    };

    if (options.areaId !== undefined) {
      where.areaId = options.areaId;
    }

    if (options.projectId !== undefined) {
      where.projectId = options.projectId;
    }

    if (options.priority !== undefined) {
      where.priority = options.priority;
    }

    if (options.canonicalStatus !== undefined) {
      where.areaStatus = { canonicalStatus: options.canonicalStatus };
    }

    if (options.labelId !== undefined) {
      where.taskLabels = { some: { labelId: options.labelId } };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy,
      take: options.limit + 1,
      ...(options.cursor !== undefined && { cursor: { id: options.cursor } }),
      include: { areaStatus: { select: { canonicalStatus: true } } },
    });

    const hasMore = tasks.length > options.limit;
    const lastFetched = hasMore ? tasks.at(options.limit) : undefined;
    const nextCursor = lastFetched?.id;
    const slicedTasks = tasks.slice(0, options.limit);

    const summaries: TaskSummary[] = slicedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      canonicalStatus: task.areaStatus.canonicalStatus,
      dueAt: task.dueAt,
      plannedAt: task.plannedAt,
      lifecycleState: task.lifecycleState,
      version: task.version,
      areaId: task.areaId,
    }));

    return { tasks: summaries, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async findTodayTasks(
    userId: string,
    todayStart: Date,
    todayEnd: Date,
  ): Promise<readonly (TaskSummary & { readonly reasons: readonly string[] })[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        lifecycleState: 'ACTIVE',
        OR: [
          { dueAt: { lt: todayStart } },
          { plannedAt: { gte: todayStart, lt: todayEnd } },
          { dueAt: { gte: todayStart, lt: todayEnd } },
        ],
      },
      orderBy: [{ dueAt: 'asc' }, { plannedAt: 'asc' }, { priority: 'asc' }, { title: 'asc' }],
      include: { areaStatus: { select: { canonicalStatus: true } } },
    });

    const result: (TaskSummary & { readonly reasons: readonly string[] })[] = [];

    for (const task of tasks) {
      const reasons: string[] = [];
      const canonicalStatus = task.areaStatus.canonicalStatus;
      const isCompleted = canonicalStatus === 'COMPLETED';

      if (isCompleted) {
        if (task.updatedAt >= todayStart && task.updatedAt < todayEnd) {
          reasons.push('completedToday');
        }
      } else {
        if (task.dueAt !== null && task.dueAt < todayStart) {
          reasons.push('overdue');
        }

        if (task.plannedAt !== null && task.plannedAt >= todayStart && task.plannedAt < todayEnd) {
          reasons.push('plannedToday');
        }

        if (task.dueAt !== null && task.dueAt >= todayStart && task.dueAt < todayEnd) {
          reasons.push('dueToday');
        }
      }

      if (reasons.length > 0) {
        result.push({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus,
          dueAt: task.dueAt,
          plannedAt: task.plannedAt,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
          reasons,
        });
      }
    }

    return result;
  }

  async findKanbanTasks(userId: string): Promise<{
    readonly todo: readonly TaskSummary[];
    readonly inProgress: readonly TaskSummary[];
    readonly completed: readonly TaskSummary[];
  }> {
    const tasks = await this.prisma.task.findMany({
      where: { userId, lifecycleState: 'ACTIVE' },
      orderBy: [{ globalRank: 'asc' }, { id: 'asc' }],
      include: { areaStatus: { select: { canonicalStatus: true } } },
    });

    const todo: TaskSummary[] = [];
    const inProgress: TaskSummary[] = [];
    const completed: TaskSummary[] = [];

    for (const task of tasks) {
      const summary: TaskSummary = {
        id: task.id,
        title: task.title,
        priority: task.priority,
        canonicalStatus: task.areaStatus.canonicalStatus,
        dueAt: task.dueAt,
        plannedAt: task.plannedAt,
        lifecycleState: task.lifecycleState,
        version: task.version,
        areaId: task.areaId,
      };

      switch (task.areaStatus.canonicalStatus) {
        case 'TO_DO':
          todo.push(summary);
          break;
        case 'IN_PROGRESS':
          inProgress.push(summary);
          break;
        case 'COMPLETED':
          completed.push(summary);
          break;
      }
    }

    return { todo, inProgress, completed };
  }

  async moveTask(
    userId: string,
    taskId: string,
    targetCanonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
    version: number,
  ): Promise<{ task: Task | null; defaultStatusId: string | null }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      select: { id: true, areaId: true, version: true },
    });

    if (!task) {
      return { task: null, defaultStatusId: null };
    }

    if (task.version !== version) {
      return { task: null, defaultStatusId: null };
    }

    const defaultStatus = await this.prisma.areaStatus.findFirst({
      where: {
        userId,
        areaId: task.areaId,
        canonicalStatus: targetCanonicalStatus,
        isDefault: true,
        active: true,
      },
      select: { id: true },
    });

    if (!defaultStatus) {
      return { task: null, defaultStatusId: null };
    }

    const maxRank = await this.prisma.task.findFirst({
      where: {
        userId,
        lifecycleState: 'ACTIVE',
        areaStatus: { canonicalStatus: targetCanonicalStatus },
      },
      orderBy: { globalRank: 'desc' },
      select: { globalRank: true },
    });

    const nextRank = maxRank ? incrementRank(maxRank.globalRank) : '000000000000000000000001';

    const result = await this.prisma.task.updateMany({
      where: { id: taskId, userId, version, lifecycleState: 'ACTIVE' },
      data: {
        areaStatusId: defaultStatus.id,
        globalRank: nextRank,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return { task: null, defaultStatusId: null };
    }

    const updatedTask = await this.prisma.task.findUnique({ where: { id: taskId } });
    return { task: updatedTask, defaultStatusId: defaultStatus.id };
  }

  async findAreaKanbanTasks(
    userId: string,
    areaId: string,
  ): Promise<{
    readonly statuses: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
      readonly canonicalStatus: string;
      readonly position: number;
    }>;
    readonly columns: ReadonlyArray<{
      readonly statusId: string;
      readonly count: number;
      readonly tasks: readonly TaskSummary[];
    }>;
  }> {
    const statuses = await this.prisma.areaStatus.findMany({
      where: { userId, areaId, active: true },
      orderBy: { position: 'asc' },
      select: { id: true, name: true, canonicalStatus: true, position: true },
    });

    const tasks = await this.prisma.task.findMany({
      where: { userId, areaId, lifecycleState: 'ACTIVE' },
      orderBy: [{ areaRank: 'asc' }, { id: 'asc' }],
      include: { areaStatus: { select: { id: true, canonicalStatus: true } } },
    });

    const taskMap = new Map<string, TaskSummary[]>();

    for (const status of statuses) {
      taskMap.set(status.id, []);
    }

    for (const task of tasks) {
      const bucket = taskMap.get(task.areaStatus.id);

      if (bucket) {
        bucket.push({
          id: task.id,
          title: task.title,
          priority: task.priority,
          canonicalStatus: task.areaStatus.canonicalStatus,
          dueAt: task.dueAt,
          plannedAt: task.plannedAt,
          lifecycleState: task.lifecycleState,
          version: task.version,
          areaId: task.areaId,
        });
      }
    }

    const columns = statuses.map((status) => ({
      statusId: status.id,
      count: taskMap.get(status.id)?.length ?? 0,
      tasks: taskMap.get(status.id) ?? [],
    }));

    return { statuses, columns };
  }

  async moveAreaKanbanTask(
    userId: string,
    taskId: string,
    targetAreaStatusId: string,
    version: number,
  ): Promise<{ task: Task | null; valid: boolean }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      select: { id: true, areaId: true, version: true },
    });

    if (!task) {
      return { task: null, valid: false };
    }

    if (task.version !== version) {
      return { task: null, valid: false };
    }

    const targetStatus = await this.prisma.areaStatus.findFirst({
      where: { id: targetAreaStatusId, userId, areaId: task.areaId, active: true },
      select: { id: true },
    });

    if (!targetStatus) {
      return { task: null, valid: false };
    }

    const maxRank = await this.prisma.task.findFirst({
      where: {
        userId,
        areaId: task.areaId,
        areaStatusId: targetAreaStatusId,
        lifecycleState: 'ACTIVE',
      },
      orderBy: { areaRank: 'desc' },
      select: { areaRank: true },
    });

    const nextRank = maxRank ? incrementRank(maxRank.areaRank) : '000000000000000000000001';

    const result = await this.prisma.task.updateMany({
      where: { id: taskId, userId, version, lifecycleState: 'ACTIVE' },
      data: {
        areaStatusId: targetAreaStatusId,
        areaRank: nextRank,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return { task: null, valid: false };
    }

    const updatedTask = await this.prisma.task.findUnique({ where: { id: taskId } });
    return { task: updatedTask, valid: true };
  }

  async searchTasks(
    userId: string,
    query: string,
    options: {
      readonly cursor?: string;
      readonly limit: number;
      readonly sort: string;
      readonly order: 'asc' | 'desc';
      readonly areaId?: string;
      readonly projectId?: string;
      readonly priority?: string;
      readonly canonicalStatus?: string;
      readonly labelId?: string;
    },
  ): Promise<{
    readonly tasks: readonly (TaskSummary & {
      readonly descriptionSnippet: string | null;
      readonly score: number;
    })[];
    readonly nextCursor?: string;
  }> {
    const searchTerms = query
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => t.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, ''));

    const titleConditions = searchTerms.map((term) => ({
      title: { contains: term, mode: 'insensitive' as const },
    }));

    const descriptionConditions = searchTerms.map((term) => ({
      description: { contains: term, mode: 'insensitive' as const },
    }));

    const where: Record<string, unknown> = {
      userId,
      lifecycleState: 'ACTIVE',
      OR: [...titleConditions, ...descriptionConditions],
    };

    if (options.areaId !== undefined) {
      where.areaId = options.areaId;
    }

    if (options.projectId !== undefined) {
      where.projectId = options.projectId;
    }

    if (options.priority !== undefined) {
      where.priority = options.priority;
    }

    if (options.canonicalStatus !== undefined) {
      where.areaStatus = { canonicalStatus: options.canonicalStatus };
    }

    if (options.labelId !== undefined) {
      where.taskLabels = { some: { labelId: options.labelId } };
    }

    const orderBy =
      options.sort === 'relevance'
        ? [{ updatedAt: 'desc' as const }, { id: 'asc' as const }]
        : buildGlobalSort(options.sort, options.order);

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy,
      take: options.limit + 1,
      ...(options.cursor !== undefined && { cursor: { id: options.cursor } }),
      include: { areaStatus: { select: { canonicalStatus: true } } },
    });

    const hasMore = tasks.length > options.limit;
    const lastFetched = hasMore ? tasks.at(options.limit) : undefined;
    const nextCursor = lastFetched?.id;
    const slicedTasks = tasks.slice(0, options.limit);

    const results = slicedTasks.map((task) => {
      let score = 0;

      for (const term of searchTerms) {
        const lowerTerm = term.toLowerCase();
        if (task.title.toLowerCase().includes(lowerTerm)) {
          score += 10;
        }
        if (task.description?.toLowerCase().includes(lowerTerm)) {
          score += 5;
        }
      }

      const snippet = task.description ? extractSnippet(task.description, searchTerms) : null;

      return {
        id: task.id,
        title: task.title,
        descriptionSnippet: snippet,
        priority: task.priority,
        canonicalStatus: task.areaStatus.canonicalStatus,
        dueAt: task.dueAt,
        plannedAt: task.plannedAt,
        lifecycleState: task.lifecycleState,
        version: task.version,
        areaId: task.areaId,
        score,
      };
    });

    results.sort((a, b) => b.score - a.score);

    return { tasks: results, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async setTaskLabels(userId: string, taskId: string, labelIds: readonly string[]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.taskLabel.deleteMany({
        where: { taskId, userId },
      });

      if (labelIds.length > 0) {
        const labels = await transaction.label.findMany({
          where: { id: { in: [...labelIds] }, userId },
          select: { id: true },
        });

        const validLabelIds = new Set(labels.map((l) => l.id));

        const validIds = labelIds.filter((id) => validLabelIds.has(id));

        if (validIds.length > 0) {
          await transaction.taskLabel.createMany({
            data: validIds.map((labelId) => ({
              userId,
              taskId,
              labelId,
            })),
          });
        }
      }
    });
  }

  async bulkStatusChange(
    userId: string,
    items: readonly { taskId: string; etag: string }[],
    targetCanonicalStatus?: string,
    targetAreaStatusId?: string,
  ): Promise<
    readonly {
      taskId: string;
      success: boolean;
      version?: number;
      etag?: string;
      errorCode?: string;
      errorDetail?: string;
    }[]
  > {
    const results: {
      taskId: string;
      success: boolean;
      version?: number;
      etag?: string;
      errorCode?: string;
      errorDetail?: string;
    }[] = [];

    for (const item of items) {
      const task = await this.prisma.task.findFirst({
        where: { id: item.taskId, userId, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true, areaId: true },
      });

      if (!task) {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'RESOURCE_NOT_FOUND',
          errorDetail: 'Görev bulunamadı.',
        });
        continue;
      }

      const currentEtag = String(task.version);
      if (currentEtag !== item.etag) {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'PRECONDITION_FAILED',
          errorDetail: 'Versiyon çakışması.',
        });
        continue;
      }

      let statusId: string | null = null;

      if (targetAreaStatusId) {
        const validStatus = await this.prisma.areaStatus.findFirst({
          where: { id: targetAreaStatusId, userId, areaId: task.areaId, active: true },
          select: { id: true },
        });

        if (!validStatus) {
          results.push({
            taskId: item.taskId,
            success: false,
            errorCode: 'INVALID_STATUS',
            errorDetail: 'Geçersiz alan durumu.',
          });
          continue;
        }

        statusId = targetAreaStatusId;
      } else if (targetCanonicalStatus) {
        const defaultStatus = await this.prisma.areaStatus.findFirst({
          where: {
            userId,
            areaId: task.areaId,
            canonicalStatus: targetCanonicalStatus as 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
            isDefault: true,
            active: true,
          },
          select: { id: true },
        });

        if (!defaultStatus) {
          results.push({
            taskId: item.taskId,
            success: false,
            errorCode: 'INVALID_STATUS',
            errorDetail: 'Geçersiz durum.',
          });
          continue;
        }

        statusId = defaultStatus.id;
      }

      if (statusId) {
        const updateResult = await this.prisma.task.updateMany({
          where: { id: item.taskId, userId, version: task.version, lifecycleState: 'ACTIVE' },
          data: { areaStatusId: statusId, version: { increment: 1 } },
        });

        if (updateResult.count === 0) {
          results.push({
            taskId: item.taskId,
            success: false,
            errorCode: 'PRECONDITION_FAILED',
            errorDetail: 'Versiyon çakışması.',
          });
          continue;
        }

        const updated = await this.prisma.task.findUnique({ where: { id: item.taskId } });
        results.push({
          taskId: item.taskId,
          success: true,
          ...(updated?.version !== undefined && { version: updated.version }),
          etag: String(updated?.version),
        });
      } else {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'INVALID_INPUT',
          errorDetail: 'Geçersiz istek.',
        });
      }
    }

    return results;
  }

  async bulkLabelChange(
    userId: string,
    items: readonly { taskId: string; etag: string }[],
    labelAction: 'add' | 'remove',
    labelIds: readonly string[],
  ): Promise<
    readonly {
      taskId: string;
      success: boolean;
      version?: number;
      etag?: string;
      errorCode?: string;
      errorDetail?: string;
    }[]
  > {
    const results: {
      taskId: string;
      success: boolean;
      version?: number;
      etag?: string;
      errorCode?: string;
      errorDetail?: string;
    }[] = [];

    const validLabels = await this.prisma.label.findMany({
      where: { id: { in: [...labelIds] }, userId },
      select: { id: true },
    });

    const validLabelIds = new Set(validLabels.map((l) => l.id));
    const filteredLabelIds = labelIds.filter((id) => validLabelIds.has(id));

    for (const item of items) {
      const task = await this.prisma.task.findFirst({
        where: { id: item.taskId, userId, lifecycleState: 'ACTIVE' },
        select: { id: true, version: true },
      });

      if (!task) {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'RESOURCE_NOT_FOUND',
          errorDetail: 'Görev bulunamadı.',
        });
        continue;
      }

      const currentEtag = String(task.version);
      if (currentEtag !== item.etag) {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'PRECONDITION_FAILED',
          errorDetail: 'Versiyon çakışması.',
        });
        continue;
      }

      try {
        await this.prisma.$transaction(async (transaction) => {
          if (labelAction === 'add') {
            const existing = await transaction.taskLabel.findMany({
              where: { taskId: item.taskId, userId, labelId: { in: filteredLabelIds } },
              select: { labelId: true },
            });

            const existingSet = new Set(existing.map((e) => e.labelId));
            const newLabelIds = filteredLabelIds.filter((id) => !existingSet.has(id));

            if (newLabelIds.length > 0) {
              await transaction.taskLabel.createMany({
                data: newLabelIds.map((labelId) => ({ userId, taskId: item.taskId, labelId })),
              });
            }
          } else {
            await transaction.taskLabel.deleteMany({
              where: { taskId: item.taskId, userId, labelId: { in: filteredLabelIds } },
            });
          }

          await transaction.task.update({
            where: { id: item.taskId },
            data: { version: { increment: 1 } },
          });
        });

        const updated = await this.prisma.task.findUnique({ where: { id: item.taskId } });
        results.push({
          taskId: item.taskId,
          success: true,
          ...(updated?.version !== undefined && { version: updated.version }),
          etag: String(updated?.version),
        });
      } catch {
        results.push({
          taskId: item.taskId,
          success: false,
          errorCode: 'INTERNAL_ERROR',
          errorDetail: 'İşlem başarısız.',
        });
      }
    }

    return results;
  }
}

function incrementRank(rank: string): string {
  const num = BigInt(rank) + 1000n;
  return num.toString().padStart(24, '0');
}

const SORT_FIELDS: Record<string, string> = {
  plannedDate: 'plannedAt',
  dueDate: 'dueAt',
  priority: 'priority',
  title: 'title',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  canonicalStatus: 'areaStatusId',
};

function buildGlobalSort(
  sort: string,
  order: 'asc' | 'desc',
): Array<{ readonly [key: string]: 'asc' | 'desc' }> {
  const field = SORT_FIELDS[sort] ?? 'plannedAt';

  return [{ [field]: order }, { id: 'asc' }];
}

function extractSnippet(description: string, searchTerms: readonly string[]): string | null {
  const lowerDesc = description.toLowerCase();

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase();
    const idx = lowerDesc.indexOf(lowerTerm);
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(description.length, idx + term.length + 60);
      let snippet = description.slice(start, end);
      if (start > 0) snippet = `...${snippet}`;
      if (end < description.length) snippet = `${snippet}...`;
      return snippet;
    }
  }

  return description.slice(0, 100) + (description.length > 100 ? '...' : '');
}
