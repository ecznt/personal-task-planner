import { Inject, Injectable } from '@nestjs/common';

import { TaskRepository } from '../infrastructure/task.repository';
import type { Task, TaskDetail, TaskSummary } from '../domain/task.entity';

export type CreateTaskCommand = {
  readonly areaId: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: Date | null;
  readonly dueAt: Date | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
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
  | { readonly outcome: 'SUCCESS'; readonly task: Task; readonly etag: number; readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' }
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

export type MoveKanbanTaskCommand = {
  readonly taskId: string;
  readonly targetCanonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly version: number;
};

export type MoveKanbanTaskResult =
  | { readonly outcome: 'SUCCESS'; readonly task: Task; readonly etag: number; readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' }
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
  | { readonly outcome: 'SUCCESS'; readonly task: Task; readonly etag: number; readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED' }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'STALE_VERSION' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

@Injectable()
export class TaskService {
  constructor(@Inject(TaskRepository) private readonly taskRepository: TaskRepository) {}

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

    const areaExists = await this.taskRepository.areaExists(userId, command.areaId);

    if (!areaExists) {
      return { outcome: 'NOT_FOUND' };
    }

    const defaultStatus = await this.taskRepository.findDefaultToDoStatus(userId, command.areaId);

    if (!defaultStatus) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Alanda varsayılan durum bulunamadı.',
      };
    }

    const task = await this.taskRepository.createTask(
      userId,
      command.areaId,
      {
        title,
        description: command.description,
        plannedAt: command.plannedAt,
        dueAt: command.dueAt,
        priority: command.priority,
      },
      defaultStatus.id,
    );

    return { outcome: 'SUCCESS', task, etag: task.version };
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

    return { outcome: 'SUCCESS', task, etag: task.version, canonicalStatus: command.targetCanonicalStatus };
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

    const canonicalStatus = await this.taskRepository.getCanonicalStatus(userId, command.targetAreaStatusId);

    return { outcome: 'SUCCESS', task, etag: task.version, canonicalStatus: canonicalStatus ?? 'TO_DO' };
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

    return { outcome: 'SUCCESS', task, etag: task.version, canonicalStatus: canonicalStatus ?? 'TO_DO' };
  }
}

function parseTodayRange(timezone: string): {
  todayStart: Date;
  todayEnd: Date;
  todayStr: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayStr = formatter.format(now);
  const parts = todayStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

  return { todayStart, todayEnd, todayStr };
}
