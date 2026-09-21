import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type {
  DateStateValue,
  KanbanTaskFilter,
  KanbanTaskSummary,
  RecurrenceSeriesDetail,
  Task,
  TaskDetail,
  TaskPriority,
  TaskSummary,
} from '../domain/task.entity';

const SUBTASK_COUNT_SELECT = {
  id: true,
  areaStatus: { select: { canonicalStatus: true } },
} as const;

type SubtaskCountRow = {
  readonly areaStatus: { readonly canonicalStatus: string };
};

export type AreaKanbanBucketResult = {
  readonly statuses: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly canonicalStatus: string;
    readonly position: number;
  }>;
  readonly columns: ReadonlyArray<{
    readonly statusId: string;
    readonly count: number;
    readonly tasks: readonly KanbanTaskSummary[];
  }>;
};

export type ProjectKanbanMoveResult =
  | { readonly outcome: 'MOVED'; readonly task: Task }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'INVALID_TARGET' };

export function toSubtaskStats(subtasks: readonly SubtaskCountRow[]): {
  readonly subtaskCount: number;
  readonly completedSubtaskCount: number;
} {
  return {
    subtaskCount: subtasks.length,
    completedSubtaskCount: subtasks.filter(
      (subtask) => subtask.areaStatus.canonicalStatus === 'COMPLETED',
    ).length,
  };
}

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
      readonly projectId: string | null;
      readonly parentTaskId: string | null;
      readonly labelIds: readonly string[];
      readonly checklistItems: readonly { text: string }[];
      readonly recurrence: {
        readonly mode: 'CALENDAR_BASED' | 'COMPLETION_BASED';
        readonly frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
        readonly interval: number;
        readonly selectedWeekdays: readonly number[];
        readonly dayOfMonth: number | null;
        readonly monthOfYear: number | null;
        readonly localTime: string | null;
      } | null;
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

      const recurrenceSeriesId = randomUUID();
      const recurrenceRuleVersionId = randomUUID();

      const task = await transaction.task.create({
        data: {
          userId,
          areaId,
          projectId: input.projectId,
          parentTaskId: input.parentTaskId,
          areaStatusId: defaultStatusId,
          title: input.title,
          description: input.description,
          plannedAt: input.plannedAt,
          dueAt: input.dueAt,
          priority: input.priority,
          globalRank: nextGlobalRank,
          areaRank: nextAreaRank,
          ...(input.recurrence
            ? {
                recurrenceSeriesId,
                recurrenceRuleVersionId,
                occurrenceNumber: 1,
              }
            : {}),
        },
      });

      if (input.recurrence) {
        const series = await transaction.recurrenceSeries.create({
          data: {
            id: recurrenceSeriesId,
            userId,
            currentOpenTaskId: task.id,
            nextOccurrenceNumber: 2,
            activeRuleVersionId: recurrenceRuleVersionId,
          },
        });

        const ruleVersion = await transaction.recurrenceRuleVersion.create({
          data: {
            id: recurrenceRuleVersionId,
            userId,
            seriesId: series.id,
            versionNumber: 1,
            mode: input.recurrence.mode,
            frequency: input.recurrence.frequency,
            interval: input.recurrence.interval,
            selectedWeekdays: [...input.recurrence.selectedWeekdays],
            dayOfMonth: input.recurrence.dayOfMonth,
            monthOfYear: input.recurrence.monthOfYear,
            localTime: input.recurrence.localTime,
          },
        });

        await transaction.task.update({
          where: { id: task.id },
          data: {
            recurrenceSeriesId: series.id,
            recurrenceRuleVersionId: ruleVersion.id,
            occurrenceNumber: 1,
          },
        });
      }

      if (input.labelIds.length > 0) {
        await transaction.taskLabel.createMany({
          data: input.labelIds.map((labelId) => ({
            userId,
            taskId: task.id,
            labelId,
          })),
        });
      }

      if (input.checklistItems.length > 0) {
        await transaction.checklistItem.createMany({
          data: input.checklistItems.map((item, index) => ({
            userId,
            taskId: task.id,
            text: item.text,
            position: index + 1,
          })),
        });
      }

      return task;
    });
  }

  async findDefaultToDoStatus(userId: string, areaId: string): Promise<{ id: string } | null> {
    return this.prisma.areaStatus.findFirst({
      where: { userId, areaId, canonicalStatus: 'TO_DO', isDefault: true, active: true },
      select: { id: true },
    });
  }

  async findParentForSubtask(
    userId: string,
    parentTaskId: string,
  ): Promise<{ id: string; areaId: string; parentTaskId: string | null } | null> {
    return this.prisma.task.findFirst({
      where: { id: parentTaskId, userId, lifecycleState: 'ACTIVE' },
      select: { id: true, areaId: true, parentTaskId: true },
    });
  }

  async getSubtaskStats(
    userId: string,
    taskId: string,
  ): Promise<{ readonly subtaskCount: number; readonly completedSubtaskCount: number }> {
    const subtasks = await this.prisma.task.findMany({
      where: { parentTaskId: taskId, userId, lifecycleState: 'ACTIVE' },
      select: SUBTASK_COUNT_SELECT,
    });
    return toSubtaskStats(subtasks);
  }

  async findById(userId: string, taskId: string): Promise<TaskDetail | null> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, lifecycleState: 'ACTIVE' },
      include: {
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            priority: true,
            plannedAt: true,
            dueAt: true,
            lifecycleState: true,
            areaStatus: { select: { canonicalStatus: true } },
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            areaStatus: { select: { canonicalStatus: true } },
          },
        },
      },
    });

    if (!task) {
      return null;
    }

    const { subtasks, parentTask, ...taskRow } = task;
    const subtaskStats = toSubtaskStats(subtasks);

    const areaStatus = await this.prisma.areaStatus.findUnique({
      where: { id: taskRow.areaStatusId },
      select: { canonicalStatus: true },
    });

    const area = await this.prisma.area.findUnique({
      where: { id: taskRow.areaId },
      select: { name: true },
    });

    const taskLabels = await this.prisma.taskLabel.findMany({
      where: { taskId, userId },
      include: { label: { select: { id: true, name: true, color: true, version: true } } },
    });

    const checklistItems = await this.prisma.checklistItem.findMany({
      where: { taskId, userId },
      orderBy: { position: 'asc' },
    });

    let recurrence: RecurrenceSeriesDetail | null = null;

    if (taskRow.recurrenceSeriesId) {
      const series = await this.prisma.recurrenceSeries.findFirst({
        where: { id: taskRow.recurrenceSeriesId, userId },
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
      task: taskRow,
      canonicalStatus: areaStatus?.canonicalStatus ?? 'TO_DO',
      areaName: area?.name ?? '',
      labels: taskLabels.map((tl) => ({
        id: tl.label.id,
        name: tl.label.name,
        color: tl.label.color,
        version: tl.label.version,
      })),
      checklistItems,
      recurrence,
      subtaskCount: subtaskStats.subtaskCount,
      completedSubtaskCount: subtaskStats.completedSubtaskCount,
      parentTask: parentTask
        ? {
            id: parentTask.id,
            title: parentTask.title,
            canonicalStatus: parentTask.areaStatus?.canonicalStatus ?? 'TO_DO',
          }
        : null,
      subtasks: subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        priority: subtask.priority,
        canonicalStatus: subtask.areaStatus?.canonicalStatus ?? 'TO_DO',
        plannedAt: subtask.plannedAt,
        dueAt: subtask.dueAt,
        lifecycleState: subtask.lifecycleState,
      })),
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
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
      },
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
      parentTaskId: task.parentTaskId,
      ...toSubtaskStats(task.subtasks),
      labels: task.labels.map((tl) => ({
        id: tl.label.id,
        name: tl.label.name,
        color: tl.label.color,
        version: tl.label.version,
      })),
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
      readonly parentTaskId: string | null | undefined;
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

    if (input.parentTaskId !== undefined) {
      data.parentTaskId = input.parentTaskId;
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

  async labelsBelongToUser(userId: string, labelIds: readonly string[]): Promise<boolean> {
    if (labelIds.length === 0) {
      return true;
    }

    const labels = await this.prisma.label.findMany({
      where: { id: { in: [...labelIds] }, userId },
      select: { id: true },
    });

    return labels.length === labelIds.length;
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
      readonly dateState?: DateStateValue;
      readonly todayStart?: Date;
      readonly todayEnd?: Date;
    },
  ): Promise<{ tasks: readonly TaskSummary[]; nextCursor?: string }> {
    const orderBy = buildGlobalSort(options.sort, options.order);

    const andConstraints: Record<string, unknown>[] = [];

    if (options.canonicalStatus !== undefined) {
      andConstraints.push({ areaStatus: { canonicalStatus: options.canonicalStatus } });
    }

    const dateStateConstraint =
      options.dateState !== undefined &&
      options.todayStart !== undefined &&
      options.todayEnd !== undefined
        ? buildDateStateConstraint(options.dateState, options.todayStart, options.todayEnd)
        : undefined;

    if (dateStateConstraint !== undefined) {
      andConstraints.push({ areaStatus: { canonicalStatus: { not: 'COMPLETED' } } });
      andConstraints.push(dateStateConstraint);
    }

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

    if (options.labelId !== undefined) {
      where.labels = { some: { labelId: options.labelId } };
    }

    if (andConstraints.length > 0) {
      where.AND = andConstraints;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy,
      take: options.limit + 1,
      ...(options.cursor !== undefined && { cursor: { id: options.cursor } }),
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
      },
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
      parentTaskId: task.parentTaskId,
      ...toSubtaskStats(task.subtasks),
      labels: task.labels.map((tl) => ({
        id: tl.label.id,
        name: tl.label.name,
        color: tl.label.color,
        version: tl.label.version,
      })),
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
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
      },
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
          parentTaskId: task.parentTaskId,
          ...toSubtaskStats(task.subtasks),
          labels: task.labels.map((tl) => ({
            id: tl.label.id,
            name: tl.label.name,
            color: tl.label.color,
            version: tl.label.version,
          })),
          reasons,
        });
      }
    }

    return result;
  }

  async findUpcomingTasks(
    userId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<readonly TaskSummary[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        lifecycleState: 'ACTIVE',
        areaStatus: { canonicalStatus: { not: 'COMPLETED' } },
        OR: [
          { plannedAt: { gte: rangeStart, lt: rangeEnd } },
          { dueAt: { gte: rangeStart, lt: rangeEnd } },
        ],
      },
      orderBy: [{ dueAt: 'asc' }, { plannedAt: 'asc' }, { priority: 'asc' }, { title: 'asc' }],
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      canonicalStatus: task.areaStatus.canonicalStatus,
      dueAt: task.dueAt,
      plannedAt: task.plannedAt,
      lifecycleState: task.lifecycleState,
      version: task.version,
      areaId: task.areaId,
      parentTaskId: task.parentTaskId,
      ...toSubtaskStats(task.subtasks),
      labels: task.labels.map((tl) => ({
        id: tl.label.id,
        name: tl.label.name,
        color: tl.label.color,
        version: tl.label.version,
      })),
    }));
  }

  async findKanbanTasks(
    userId: string,
    filters: KanbanTaskFilter = {},
  ): Promise<{
    readonly todo: readonly KanbanTaskSummary[];
    readonly inProgress: readonly KanbanTaskSummary[];
    readonly completed: readonly KanbanTaskSummary[];
  }> {
    const tasks = await this.prisma.task.findMany({
      where: this.buildKanbanWhere(userId, filters, filters.areaId),
      orderBy: [{ globalRank: 'asc' }, { id: 'asc' }],
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        area: { select: { name: true } },
        project: { select: { id: true, name: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            areaStatus: { select: { canonicalStatus: true } },
          },
        },
      },
    });

    const todo: KanbanTaskSummary[] = [];
    const inProgress: KanbanTaskSummary[] = [];
    const completed: KanbanTaskSummary[] = [];

    for (const task of tasks) {
      const summary = this.toKanbanTaskSummary(task);

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

  private buildKanbanWhere(
    userId: string,
    filters: KanbanTaskFilter,
    areaId?: string,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { userId, lifecycleState: 'ACTIVE' };

    if (areaId !== undefined) {
      where.areaId = areaId;
    }

    if (filters.priority !== undefined) {
      where.priority = filters.priority;
    }

    if (filters.projectId !== undefined) {
      where.projectId = filters.projectId;
    }

    if (filters.labelId !== undefined) {
      where.labels = { some: { labelId: filters.labelId } };
    }

    const searchTerms = (filters.q ?? '')
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => t.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, ''))
      .filter((t) => t.length > 0);

    if (searchTerms.length > 0) {
      where.AND = searchTerms.map((term) => ({
        title: { contains: term, mode: 'insensitive' as const },
      }));
    }

    return where;
  }

  private toKanbanTaskSummary(task: {
    readonly id: string;
    readonly title: string;
    readonly priority: TaskPriority;
    readonly dueAt: Date | null;
    readonly plannedAt: Date | null;
    readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
    readonly version: number;
    readonly areaId: string;
    readonly parentTaskId: string | null;
    readonly subtasks: readonly SubtaskCountRow[];
    readonly areaStatus: { canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' };
    readonly area: { name: string };
    readonly project: { id: string; name: string } | null;
    readonly parentTask: {
      readonly id: string;
      readonly title: string;
      readonly areaStatus: {
        readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
      } | null;
    } | null;
    readonly labels: ReadonlyArray<{
      readonly label: {
        readonly id: string;
        readonly name: string;
        readonly color: string | null;
        readonly version: number;
      };
    }>;
  }): KanbanTaskSummary {
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      canonicalStatus: task.areaStatus.canonicalStatus,
      dueAt: task.dueAt,
      plannedAt: task.plannedAt,
      lifecycleState: task.lifecycleState,
      version: task.version,
      areaId: task.areaId,
      parentTaskId: task.parentTaskId,
      ...toSubtaskStats(task.subtasks),
      labels: task.labels.map((tl) => ({
        id: tl.label.id,
        name: tl.label.name,
        color: tl.label.color,
        version: tl.label.version,
      })),
      project: task.project,
      areaName: task.area.name,
      parentTask: task.parentTask
        ? {
            id: task.parentTask.id,
            title: task.parentTask.title,
            canonicalStatus: task.parentTask.areaStatus?.canonicalStatus ?? 'TO_DO',
          }
        : null,
    };
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
    filters: KanbanTaskFilter = {},
  ): Promise<AreaKanbanBucketResult> {
    return this.findStatusBuckets(userId, areaId, filters);
  }

  async projectExists(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, lifecycleState: 'ACTIVE' },
      select: { id: true },
    });
    return project !== null;
  }

  async findProjectKanbanTasks(
    userId: string,
    projectId: string,
    filters: KanbanTaskFilter = {},
  ): Promise<AreaKanbanBucketResult> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, lifecycleState: 'ACTIVE' },
      select: { areaId: true },
    });

    if (!project) {
      return { statuses: [], columns: [] };
    }

    return this.findStatusBuckets(userId, project.areaId, {
      ...filters,
      projectId,
    });
  }

  private async findStatusBuckets(
    userId: string,
    areaId: string,
    filters: KanbanTaskFilter,
  ): Promise<AreaKanbanBucketResult> {
    const statuses = await this.prisma.areaStatus.findMany({
      where: { userId, areaId, active: true },
      orderBy: { position: 'asc' },
      select: { id: true, name: true, canonicalStatus: true, position: true },
    });

    const tasks = await this.prisma.task.findMany({
      where: this.buildKanbanWhere(userId, filters, areaId),
      orderBy: [{ areaRank: 'asc' }, { id: 'asc' }],
      include: {
        areaStatus: { select: { id: true, canonicalStatus: true } },
        area: { select: { name: true } },
        project: { select: { id: true, name: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            areaStatus: { select: { canonicalStatus: true } },
          },
        },
      },
    });

    const taskMap = new Map<string, KanbanTaskSummary[]>();

    for (const status of statuses) {
      taskMap.set(status.id, []);
    }

    for (const task of tasks) {
      const bucket = taskMap.get(task.areaStatus.id);

      if (bucket) {
        bucket.push(this.toKanbanTaskSummary(task));
      }
    }

    const columns = statuses.map((status) => ({
      statusId: status.id,
      count: taskMap.get(status.id)?.length ?? 0,
      tasks: taskMap.get(status.id) ?? [],
    }));

    return { statuses, columns };
  }

  async moveProjectKanbanTask(
    userId: string,
    projectId: string,
    taskId: string,
    targetAreaStatusId: string,
    version: number,
  ): Promise<ProjectKanbanMoveResult> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, lifecycleState: 'ACTIVE' },
      select: { areaId: true },
    });

    if (!project) {
      return { outcome: 'NOT_FOUND' };
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, projectId, lifecycleState: 'ACTIVE' },
      select: { id: true, areaId: true, version: true },
    });

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.version !== version) {
      return { outcome: 'STALE_VERSION' };
    }

    if (task.areaId !== project.areaId) {
      return { outcome: 'INVALID_TARGET' };
    }

    const targetStatus = await this.prisma.areaStatus.findFirst({
      where: { id: targetAreaStatusId, userId, areaId: project.areaId, active: true },
      select: { id: true },
    });

    if (!targetStatus) {
      return { outcome: 'INVALID_TARGET' };
    }

    const maxRank = await this.prisma.task.findFirst({
      where: {
        userId,
        areaId: project.areaId,
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
      return { outcome: 'STALE_VERSION' };
    }

    const updatedTask = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!updatedTask) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'MOVED', task: updatedTask };
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
      readonly dateState?: DateStateValue;
      readonly todayStart?: Date;
      readonly todayEnd?: Date;
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

    const andConstraints: Record<string, unknown>[] = [];

    if (options.canonicalStatus !== undefined) {
      andConstraints.push({ areaStatus: { canonicalStatus: options.canonicalStatus } });
    }

    const dateStateConstraint =
      options.dateState !== undefined &&
      options.todayStart !== undefined &&
      options.todayEnd !== undefined
        ? buildDateStateConstraint(options.dateState, options.todayStart, options.todayEnd)
        : undefined;

    if (dateStateConstraint !== undefined) {
      andConstraints.push({ areaStatus: { canonicalStatus: { not: 'COMPLETED' } } });
      andConstraints.push(dateStateConstraint);
    }

    if (options.labelId !== undefined) {
      where.labels = { some: { labelId: options.labelId } };
    }

    if (andConstraints.length > 0) {
      where.AND = andConstraints;
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
      include: {
        areaStatus: { select: { canonicalStatus: true } },
        labels: {
          select: { label: { select: { id: true, name: true, color: true, version: true } } },
        },
        subtasks: {
          where: { lifecycleState: 'ACTIVE' },
          select: SUBTASK_COUNT_SELECT,
        },
      },
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
        parentTaskId: task.parentTaskId,
        ...toSubtaskStats(task.subtasks),
        labels: task.labels.map((tl) => ({
          id: tl.label.id,
          name: tl.label.name,
          color: tl.label.color,
          version: tl.label.version,
        })),
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

function buildDateStateConstraint(
  dateState: DateStateValue,
  todayStart: Date,
  todayEnd: Date,
): Record<string, unknown> {
  switch (dateState) {
    case 'overdue':
      return { dueAt: { lt: todayStart } };
    case 'dueToday':
      return { dueAt: { gte: todayStart, lt: todayEnd } };
    case 'plannedToday':
      return { plannedAt: { gte: todayStart, lt: todayEnd } };
    case 'upcoming':
      return {
        OR: [{ plannedAt: { gte: todayEnd } }, { dueAt: { gte: todayEnd } }],
      };
    case 'noDate':
      return { plannedAt: null, dueAt: null };
  }
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
