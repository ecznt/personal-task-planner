import { Inject, Injectable } from '@nestjs/common';

import { AreaService } from './area.service';
import { TaskRepository } from '../infrastructure/task.repository';
import type { DateStateValue, Task, TaskDetail, TaskSummary } from '../domain/task.entity';
import { RecurrenceService } from './recurrence.service';
import { parseTodayRange } from './date-range';

export type CreateTaskChecklistItemInput = {
  readonly text: string;
};

export type CreateTaskRecurrenceInput = {
  readonly mode: 'CALENDAR_BASED' | 'COMPLETION_BASED';
  readonly frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  readonly interval: number;
  readonly selectedWeekdays: readonly number[];
  readonly dayOfMonth: number | null;
  readonly monthOfYear: number | null;
  readonly localTime: string | null;
};

export type CreateTaskCommand = {
  readonly areaId?: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: Date | null;
  readonly dueAt: Date | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly projectId?: string | null;
  readonly labelIds?: readonly string[];
  readonly checklistItems?: readonly CreateTaskChecklistItemInput[];
  readonly recurrence?: CreateTaskRecurrenceInput | null;
};

export type CreateTaskResult =
  | { readonly outcome: 'SUCCESS'; readonly task: Task; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type GetTaskQuery = {
  readonly taskId: string;
};

export type GetTaskResult =
  | { readonly outcome: 'SUCCESS'; readonly data: TaskDetail; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ListTasksQuery = {
  readonly areaId: string;
  readonly cursor?: string | undefined;
  readonly limit?: number;
};

export type ListTasksResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly tasks: readonly TaskSummary[];
      readonly nextCursor?: string;
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type EditTaskCommand = {
  readonly taskId: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly plannedAt?: Date | null;
  readonly dueAt?: Date | null;
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly areaStatusId?: string;
  readonly labelIds?: string[];
  readonly projectId?: string | null;
  readonly version: number;
};

export type EditTaskResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly task: Task;
      readonly etag: number;
      readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type ListGlobalTasksQuery = {
  readonly cursor?: string;
  readonly limit?: number;
  readonly sort?: string;
  readonly order?: 'asc' | 'desc';
  readonly areaId?: string;
  readonly projectId?: string;
  readonly priority?: string;
  readonly canonicalStatus?: string;
  readonly labelId?: string;
  readonly dateState?: DateStateValue;
  readonly timezone?: string;
};

export type ListGlobalTasksResult = {
  readonly outcome: 'SUCCESS';
  readonly tasks: readonly TaskSummary[];
  readonly nextCursor?: string;
};

export type ListTodayTasksQuery = {
  readonly timezone: string;
};

export type TodayTaskSummary = TaskSummary & {
  readonly reasons: readonly string[];
};

export type ListTodayTasksResult = {
  readonly outcome: 'SUCCESS';
  readonly today: string;
  readonly timezone: string;
  readonly overdue: readonly TodayTaskSummary[];
  readonly plannedToday: readonly TodayTaskSummary[];
  readonly dueToday: readonly TodayTaskSummary[];
  readonly completedToday: readonly TodayTaskSummary[];
};

export type ListKanbanTasksResult = {
  readonly outcome: 'SUCCESS';
  readonly todo: readonly TaskSummary[];
  readonly inProgress: readonly TaskSummary[];
  readonly completed: readonly TaskSummary[];
};

export type ListUpcomingTasksQuery = {
  readonly timezone: string;
  readonly days?: number;
};

export type UpcomingDayGroup = {
  readonly date: string;
  readonly planned: readonly TaskSummary[];
  readonly due: readonly TaskSummary[];
};

export type ListUpcomingTasksResult = {
  readonly outcome: 'SUCCESS';
  readonly timezone: string;
  readonly overdue: readonly TaskSummary[];
  readonly days: readonly UpcomingDayGroup[];
};

export type MoveKanbanTaskCommand = {
  readonly taskId: string;
  readonly targetCanonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly version: number;
};

export type MoveKanbanTaskResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly task: Task;
      readonly etag: number;
      readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type AreaKanbanStatusColumn = {
  readonly id: string;
  readonly name: string;
  readonly canonicalStatus: string;
  readonly position: number;
};

export type AreaKanbanColumn = {
  readonly statusId: string;
  readonly count: number;
  readonly tasks: readonly TaskSummary[];
};

export type ListAreaKanbanTasksResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly statuses: readonly AreaKanbanStatusColumn[];
      readonly columns: readonly AreaKanbanColumn[];
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type MoveAreaKanbanTaskCommand = {
  readonly taskId: string;
  readonly targetAreaStatusId: string;
  readonly version: number;
};

export type MoveAreaKanbanTaskResult =
  | {
      readonly outcome: 'SUCCESS';
      readonly task: Task;
      readonly etag: number;
      readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
    }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

@Injectable()
export class TaskService {
  constructor(
    @Inject(TaskRepository) private readonly taskRepository: TaskRepository,
    @Inject(RecurrenceService) private readonly recurrenceService: RecurrenceService,
    @Inject(AreaService) private readonly areaService?: AreaService,
  ) {}

  async createTask(userId: string, command: CreateTaskCommand): Promise<CreateTaskResult> {
    const title = command.title.trim();

    if (title.length === 0) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Görev başlığı boş olamaz.' };
    }

    if (title.length > 500) {
      return { outcome: 'VALIDATION_ERROR', detail: 'Görev başlığı 500 karakterden uzun olamaz.' };
    }

    if (command.description !== null && command.description !== undefined) {
      if (command.description.length > 5000) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Görev açıklaması 5000 karakterden uzun olamaz.',
        };
      }
    }

    if (
      command.dueAt !== null &&
      command.dueAt !== undefined &&
      command.plannedAt !== null &&
      command.plannedAt !== undefined
    ) {
      if (command.dueAt < command.plannedAt) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.',
        };
      }
    }

    const areaId = command.areaId
      ?? (await this.ensureInboxAreaId(userId));

    const areaExists = await this.taskRepository.areaExists(userId, areaId);

    if (!areaExists) {
      return { outcome: 'NOT_FOUND' };
    }

    if (command.projectId !== undefined && command.projectId !== null) {
      const projectBelongs = await this.taskRepository.projectBelongsToArea(
        userId,
        command.projectId,
        areaId,
      );

      if (!projectBelongs) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Proje aynı alanda bulunamadı.',
        };
      }
    }

    if (command.labelIds !== undefined && command.labelIds.length > 0) {
      const labelsBelong = await this.taskRepository.labelsBelongToUser(userId, command.labelIds);

      if (!labelsBelong) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Seçilen etiketlerden biri veya birkaçı geçersiz.',
        };
      }
    }

    if (command.recurrence !== undefined && command.recurrence !== null) {
      if (command.recurrence.interval < 1) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Aralık 1 veya daha büyük olmalıdır.',
        };
      }

      if (
        command.recurrence.frequency === 'WEEKLY' &&
        command.recurrence.selectedWeekdays.length === 0
      ) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Haftalık tekrarlama için en az bir gün seçmelisiniz.',
        };
      }

      if (command.recurrence.frequency === 'MONTHLY' && command.recurrence.dayOfMonth === null) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Aylık tekrarlama için gün seçmelisiniz.',
        };
      }

      if (
        command.recurrence.frequency === 'YEARLY' &&
        (command.recurrence.monthOfYear === null || command.recurrence.dayOfMonth === null)
      ) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Yıllık tekrarlama için ay ve gün seçmelisiniz.',
        };
      }

      const anchor = command.plannedAt ?? command.dueAt;

      if (!anchor) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Tekrarlayan görev için planlama veya bitiş tarihi gereklidir.',
        };
      }
    }

    const defaultStatus = await this.taskRepository.findDefaultToDoStatus(userId, areaId);

    if (!defaultStatus) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Alanda varsayılan durum bulunamadı.',
      };
    }

    const task = await this.taskRepository.createTask(
      userId,
      areaId,
      {
        title,
        description: command.description,
        plannedAt: command.plannedAt,
        dueAt: command.dueAt,
        priority: command.priority,
        projectId: command.projectId ?? null,
        labelIds: command.labelIds ?? [],
        checklistItems: command.checklistItems ?? [],
        recurrence: command.recurrence ?? null,
      },
      defaultStatus.id,
    );

    return { outcome: 'SUCCESS', task, etag: task.version };
  }

  private async ensureInboxAreaId(userId: string): Promise<string> {
    if (!this.areaService) {
      throw new Error('AreaService is not available.');
    }

    const inbox = await this.areaService.ensureInbox(userId);
    return inbox.id;
  }

  async getTask(userId: string, query: GetTaskQuery): Promise<GetTaskResult> {
    const data = await this.taskRepository.findById(userId, query.taskId);

    if (!data) {
      return { outcome: 'NOT_FOUND' };
    }

    return { outcome: 'SUCCESS', data, etag: data.task.version };
  }

  async listTasks(userId: string, query: ListTasksQuery): Promise<ListTasksResult> {
    const areaExists = await this.taskRepository.areaExists(userId, query.areaId);

    if (!areaExists) {
      return { outcome: 'NOT_FOUND' };
    }

    const { tasks, nextCursor } = await this.taskRepository.listByArea(
      userId,
      query.areaId,
      query.cursor,
      query.limit,
    );

    return {
      outcome: 'SUCCESS',
      tasks,
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async listGlobalTasks(
    userId: string,
    query: ListGlobalTasksQuery,
  ): Promise<ListGlobalTasksResult> {
    const sort = query.sort ?? 'plannedDate';
    const order = query.order ?? 'asc';
    const limit = query.limit ?? 20;

    const range =
      query.dateState !== undefined
        ? parseTodayRange(query.timezone ?? 'Europe/Istanbul')
        : undefined;

    const { tasks, nextCursor } = await this.taskRepository.listGlobal(userId, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit,
      sort,
      order,
      ...(query.areaId !== undefined && { areaId: query.areaId }),
      ...(query.projectId !== undefined && { projectId: query.projectId }),
      ...(query.priority !== undefined && { priority: query.priority }),
      ...(query.canonicalStatus !== undefined && { canonicalStatus: query.canonicalStatus }),
      ...(query.labelId !== undefined && { labelId: query.labelId }),
      ...(query.dateState !== undefined &&
        range !== undefined && {
          dateState: query.dateState,
          todayStart: range.todayStart,
          todayEnd: range.todayEnd,
        }),
    });

    return {
      outcome: 'SUCCESS',
      tasks,
      ...(nextCursor !== undefined && { nextCursor }),
    };
  }

  async listTodayTasks(userId: string, query: ListTodayTasksQuery): Promise<ListTodayTasksResult> {
    const { todayStart, todayEnd, todayStr } = parseTodayRange(query.timezone);

    const allTasks = await this.taskRepository.findTodayTasks(userId, todayStart, todayEnd);

    const overdue: TodayTaskSummary[] = [];
    const plannedToday: TodayTaskSummary[] = [];
    const dueToday: TodayTaskSummary[] = [];
    const completedToday: TodayTaskSummary[] = [];
    const plannedTaskIds = new Set<string>();

    for (const task of allTasks) {
      if (task.reasons.includes('completedToday')) {
        completedToday.push(task);
        continue;
      }

      if (task.reasons.includes('plannedToday')) {
        plannedToday.push(task);
        plannedTaskIds.add(task.id);
      }

      if (task.reasons.includes('overdue')) {
        overdue.push(task);
      }

      if (task.reasons.includes('dueToday') && !plannedTaskIds.has(task.id)) {
        dueToday.push(task);
      }
    }

    return {
      outcome: 'SUCCESS',
      today: todayStr,
      timezone: query.timezone,
      overdue,
      plannedToday,
      dueToday,
      completedToday,
    };
  }

  async listUpcomingTasks(
    userId: string,
    query: ListUpcomingTasksQuery,
  ): Promise<ListUpcomingTasksResult> {
    const days = Math.min(31, Math.max(1, query.days ?? 14));
    const ranges = buildDayRangesInTimeZone(query.timezone, days);
    const rangeStart = ranges[0]?.start;
    const rangeEnd = ranges[ranges.length - 1]?.end;

    if (rangeStart === undefined || rangeEnd === undefined) {
      return { outcome: 'SUCCESS', timezone: query.timezone, overdue: [], days: [] };
    }

    const tasks = await this.taskRepository.findUpcomingTasks(userId, rangeStart, rangeEnd);

    const overdue: TaskSummary[] = [];
    const dayGroups: Map<string, { planned: TaskSummary[]; due: TaskSummary[] }> = new Map();

    for (const range of ranges) {
      dayGroups.set(range.date, { planned: [], due: [] });
    }

    for (const task of tasks) {
      if (task.plannedAt !== null && task.plannedAt >= rangeStart) {
        const day = ranges.find(
          (r) => task.plannedAt !== null && task.plannedAt >= r.start && task.plannedAt < r.end,
        );

        if (day) {
          dayGroups.get(day.date)?.planned.push(task);
          continue;
        }
      }

      if (task.dueAt !== null && task.dueAt >= rangeStart) {
        const day = ranges.find(
          (r) => task.dueAt !== null && task.dueAt >= r.start && task.dueAt < r.end,
        );

        if (day) {
          dayGroups.get(day.date)?.due.push(task);
          continue;
        }
      }

      overdue.push(task);
    }

    return {
      outcome: 'SUCCESS',
      timezone: query.timezone,
      overdue,
      days: Array.from(dayGroups.entries()).map(([date, group]) => ({
        date,
        planned: group.planned,
        due: group.due,
      })),
    };
  }

  async listKanbanTasks(userId: string): Promise<ListKanbanTasksResult> {
    const { todo, inProgress, completed } = await this.taskRepository.findKanbanTasks(userId);

    return {
      outcome: 'SUCCESS',
      todo,
      inProgress,
      completed,
    };
  }

  async moveKanbanTask(
    userId: string,
    command: MoveKanbanTaskCommand,
  ): Promise<MoveKanbanTaskResult> {
    const { task, defaultStatusId } = await this.taskRepository.moveTask(
      userId,
      command.taskId,
      command.targetCanonicalStatus,
      command.version,
    );

    if (!task) {
      const existing = await this.taskRepository.findById(userId, command.taskId);

      if (!existing) {
        return { outcome: 'NOT_FOUND' };
      }

      return { outcome: 'STALE_VERSION' };
    }

    if (!defaultStatusId) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Hedef durum için varsayılan alan durumu bulunamadı.',
      };
    }

    if (command.targetCanonicalStatus === 'COMPLETED' && task.recurrenceSeriesId) {
      await this.recurrenceService.generateNextOccurrence(userId, task.id);
    }

    return {
      outcome: 'SUCCESS',
      task,
      etag: task.version,
      canonicalStatus: command.targetCanonicalStatus,
    };
  }

  async listAreaKanbanTasks(userId: string, areaId: string): Promise<ListAreaKanbanTasksResult> {
    const areaExists = await this.taskRepository.areaExists(userId, areaId);

    if (!areaExists) {
      return { outcome: 'NOT_FOUND' };
    }

    const { statuses, columns } = await this.taskRepository.findAreaKanbanTasks(userId, areaId);
    return { outcome: 'SUCCESS', statuses, columns };
  }

  async moveAreaKanbanTask(
    userId: string,
    command: MoveAreaKanbanTaskCommand,
  ): Promise<MoveAreaKanbanTaskResult> {
    const { task, valid } = await this.taskRepository.moveAreaKanbanTask(
      userId,
      command.taskId,
      command.targetAreaStatusId,
      command.version,
    );

    if (!task) {
      if (!valid) {
        const existing = await this.taskRepository.findById(userId, command.taskId);

        if (!existing) {
          return { outcome: 'NOT_FOUND' };
        }

        return { outcome: 'STALE_VERSION' };
      }

      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Hedef durum bulunamadı.',
      };
    }

    const canonicalStatus = await this.taskRepository.getCanonicalStatus(
      userId,
      command.targetAreaStatusId,
    );

    if (canonicalStatus === 'COMPLETED' && task.recurrenceSeriesId) {
      await this.recurrenceService.generateNextOccurrence(userId, task.id);
    }

    return {
      outcome: 'SUCCESS',
      task,
      etag: task.version,
      canonicalStatus: canonicalStatus ?? 'TO_DO',
    };
  }

  async editTask(userId: string, command: EditTaskCommand): Promise<EditTaskResult> {
    if (command.title !== undefined) {
      const title = command.title.trim();

      if (title.length === 0) {
        return { outcome: 'VALIDATION_ERROR', detail: 'Görev başlığı boş olamaz.' };
      }

      if (title.length > 500) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Görev başlığı 500 karakterden uzun olamaz.',
        };
      }
    }

    if (command.description !== undefined && command.description !== null) {
      if (command.description.length > 5000) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Görev açıklaması 5000 karakterden uzun olamaz.',
        };
      }
    }

    if (
      command.dueAt !== undefined &&
      command.dueAt !== null &&
      command.plannedAt !== undefined &&
      command.plannedAt !== null
    ) {
      if (command.dueAt < command.plannedAt) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.',
        };
      }
    }

    if (command.areaStatusId !== undefined && command.areaStatusId !== null) {
      const existing = await this.taskRepository.findById(userId, command.taskId);

      if (!existing) {
        return { outcome: 'NOT_FOUND' };
      }

      const statusBelongs = await this.taskRepository.areaStatusBelongsToArea(
        userId,
        existing.task.areaId,
        command.areaStatusId,
      );

      if (!statusBelongs) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Geçersiz durum seçimi.',
        };
      }
    }

    if (command.projectId !== undefined && command.projectId !== null) {
      const existing = await this.taskRepository.findById(userId, command.taskId);

      if (!existing) {
        return { outcome: 'NOT_FOUND' };
      }

      const projectBelongs = await this.taskRepository.projectBelongsToArea(
        userId,
        command.projectId,
        existing.task.areaId,
      );

      if (!projectBelongs) {
        return {
          outcome: 'VALIDATION_ERROR',
          detail: 'Proje aynı alanda bulunamadı.',
        };
      }
    }

    const task = await this.taskRepository.updateTask(
      userId,
      command.taskId,
      {
        title: command.title,
        description: command.description,
        plannedAt: command.plannedAt,
        dueAt: command.dueAt,
        priority: command.priority,
        areaStatusId: command.areaStatusId,
        projectId: command.projectId,
      },
      command.version,
    );

    if (!task) {
      const existing = await this.taskRepository.findById(userId, command.taskId);

      if (!existing) {
        return { outcome: 'NOT_FOUND' };
      }

      return { outcome: 'STALE_VERSION' };
    }

    if (command.labelIds !== undefined) {
      await this.taskRepository.setTaskLabels(userId, command.taskId, command.labelIds);
    }

    const canonicalStatus = await this.taskRepository.getCanonicalStatus(userId, task.areaStatusId);

    return {
      outcome: 'SUCCESS',
      task,
      etag: task.version,
      canonicalStatus: canonicalStatus ?? 'TO_DO',
    };
  }
}

function buildDayRangesInTimeZone(
  timezone: string,
  days: number,
): { date: string; start: Date; end: Date }[] {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayParts = formatter.format(now).split('-');
  const startBase = Date.UTC(Number(todayParts[0]), Number(todayParts[1]) - 1, Number(todayParts[2]));

  const ranges: { date: string; start: Date; end: Date }[] = [];

  for (let i = 0; i < days; i += 1) {
    const start = new Date(startBase + i * 86_400_000);
    const end = new Date(start.getTime() + 86_400_000);
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    ranges.push({ date: dateFormatter.format(start), start, end });
  }

  return ranges;
}
