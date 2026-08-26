import { Inject, Injectable } from '@nestjs/common';

import { buildGenerationKey, calculateNextOccurrence } from '../domain/recurrence-calculator';
import type { RecurrenceSeriesDetail } from '../domain/task.entity';
import { RecurrenceRepository } from '../infrastructure/recurrence.repository';
import { TaskRepository } from '../infrastructure/task.repository';

export type SetRecurrenceCommand = {
  readonly taskId: string;
  readonly mode: 'CALENDAR_BASED' | 'COMPLETION_BASED';
  readonly frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  readonly interval: number;
  readonly selectedWeekdays: readonly number[];
  readonly dayOfMonth: number | null;
  readonly monthOfYear: number | null;
  readonly localTime: string | null;
};

export type SetRecurrenceResult =
  | { readonly outcome: 'SUCCESS'; readonly recurrence: RecurrenceSeriesDetail; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type StopRecurrenceCommand = {
  readonly taskId: string;
};

export type StopRecurrenceResult =
  | { readonly outcome: 'SUCCESS'; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

export type GetRecurrenceQuery = {
  readonly taskId: string;
};

export type GetRecurrenceResult =
  | { readonly outcome: 'SUCCESS'; readonly recurrence: RecurrenceSeriesDetail; readonly etag: number }
  | { readonly outcome: 'NOT_FOUND' }
  | { readonly outcome: 'UNAUTHENTICATED' };

@Injectable()
export class RecurrenceService {
  constructor(
    @Inject(RecurrenceRepository) private readonly recurrenceRepo: RecurrenceRepository,
    @Inject(TaskRepository) private readonly taskRepo: TaskRepository,
  ) {}

  async setRecurrence(
    userId: string,
    command: SetRecurrenceCommand,
  ): Promise<SetRecurrenceResult> {
    const task = await this.taskRepo.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (task.recurrence) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Bu görev zaten tekrarlayan bir göreve bağlı.',
      };
    }

    if (command.interval < 1) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Aralık 1 veya daha büyük olmalıdır.',
      };
    }

    if (command.frequency === 'WEEKLY' && command.selectedWeekdays.length === 0) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Haftalık tekrarlama için en az bir gün seçmelisiniz.',
      };
    }

    if (command.frequency === 'MONTHLY' && command.dayOfMonth === null) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Aylık tekrarlama için gün seçmelisiniz.',
      };
    }

    if (command.frequency === 'YEARLY' && (command.monthOfYear === null || command.dayOfMonth === null)) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Yıllık tekrarlama için ay ve gün seçmelisiniz.',
      };
    }

    const anchor = task.task.plannedAt ?? task.task.dueAt;

    if (!anchor) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Tekrarlayan görev için planlama veya bitiş tarihi gereklidir.',
      };
    }

    const recurrence = await this.recurrenceRepo.createSeries(userId, command.taskId, {
      mode: command.mode,
      frequency: command.frequency,
      interval: command.interval,
      selectedWeekdays: command.selectedWeekdays,
      dayOfMonth: command.dayOfMonth,
      monthOfYear: command.monthOfYear,
      localTime: command.localTime,
    });

    const updatedTask = await this.taskRepo.findById(userId, command.taskId);
    const etag = updatedTask?.task.version ?? 1;

    return { outcome: 'SUCCESS', recurrence, etag };
  }

  async stopRecurrence(
    userId: string,
    command: StopRecurrenceCommand,
  ): Promise<StopRecurrenceResult> {
    const task = await this.taskRepo.findById(userId, command.taskId);

    if (!task) {
      return { outcome: 'NOT_FOUND' };
    }

    if (!task.recurrence) {
      return {
        outcome: 'VALIDATION_ERROR',
        detail: 'Bu görev tekrarlayan bir görev değil.',
      };
    }

    await this.recurrenceRepo.stopSeries(userId, task.recurrence.series.id);

    const updatedTask = await this.taskRepo.findById(userId, command.taskId);
    const etag = updatedTask?.task.version ?? 1;

    return { outcome: 'SUCCESS', etag };
  }

  async getRecurrence(
    userId: string,
    query: GetRecurrenceQuery,
  ): Promise<GetRecurrenceResult> {
    const recurrence = await this.recurrenceRepo.findSeriesDetail(userId, query.taskId);

    if (!recurrence) {
      return { outcome: 'NOT_FOUND' };
    }

    const task = await this.taskRepo.findById(userId, query.taskId);
    const etag = task?.task.version ?? 1;

    return { outcome: 'SUCCESS', recurrence, etag };
  }

  async generateNextOccurrence(
    userId: string,
    completedTaskId: string,
  ): Promise<{ readonly successorTaskId: string | null }> {
    const completionData = await this.recurrenceRepo.findSeriesForCompletion(userId, completedTaskId);

    if (!completionData) {
      return { successorTaskId: null };
    }

    const { series, activeRule, task } = completionData;

    const anchor = task.plannedAt ?? task.dueAt;

    if (!anchor) {
      return { successorTaskId: null };
    }

    const nextDate = calculateNextOccurrence(anchor, {
      frequency: activeRule.frequency,
      interval: activeRule.interval,
      selectedWeekdays: activeRule.selectedWeekdays,
      dayOfMonth: activeRule.dayOfMonth,
      monthOfYear: activeRule.monthOfYear,
      localTime: activeRule.localTime,
    });

    const defaultStatus = await this.taskRepo.findDefaultToDoStatus(userId, task.areaId);

    if (!defaultStatus) {
      return { successorTaskId: null };
    }

    const plannedOffset = task.plannedAt && task.dueAt
      ? task.dueAt.getTime() - task.plannedAt.getTime()
      : null;

    const nextPlannedAt = task.plannedAt ? nextDate : null;
    const nextDueAt = task.dueAt
      ? plannedOffset !== null
        ? new Date(nextDate.getTime() + plannedOffset)
        : nextDate
      : null;

    const generationKey = buildGenerationKey(series.id, completedTaskId);

    const result = await this.recurrenceRepo.generateSuccessor(
      userId,
      series.id,
      completedTaskId,
      generationKey,
      {
        areaId: task.areaId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        plannedAt: nextPlannedAt,
        dueAt: nextDueAt,
        priority: task.priority,
        defaultStatusId: defaultStatus.id,
        occurrenceNumber: series.nextOccurrenceNumber,
        ruleVersionId: activeRule.id,
      },
    );

    if (!result) {
      return { successorTaskId: null };
    }

    await this.recurrenceRepo.copyLabels(userId, completedTaskId, result.taskId);
    await this.recurrenceRepo.copyChecklist(userId, completedTaskId, result.taskId);

    return { successorTaskId: result.taskId };
  }
}
