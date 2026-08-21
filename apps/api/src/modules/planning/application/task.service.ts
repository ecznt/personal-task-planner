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
  | { readonly outcome: 'SUCCESS'; readonly task: Task; readonly etag: number }
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

    return { outcome: 'SUCCESS', task, etag: task.version };
  }
}
