import { Inject, Injectable } from '@nestjs/common';

import { ReminderRepository } from '../infrastructure/reminder.repository';
import { TaskRepository } from '../infrastructure/task.repository';
import type { TaskReminder } from '../domain/reminder.entity';

export type CreateReminderCommand = {
  readonly userId: string;
  readonly taskId: string;
  readonly anchorType: 'PLANNED' | 'DUE';
  readonly ruleType: 'OFFSET' | 'AT_TIME';
  readonly offsetMinutes?: number;
  readonly atTime?: string;
};

export type CreateReminderResult = {
  readonly outcome: 'SUCCESS' | 'TASK_NOT_FOUND' | 'TASK_NO_TIME' | 'DUPLICATE_REMINDER';
  readonly reminder?: TaskReminder;
};

@Injectable()
export class ReminderService {
  constructor(
    @Inject(ReminderRepository) private readonly reminderRepository: ReminderRepository,
    @Inject(TaskRepository) private readonly taskRepository: TaskRepository,
  ) {}

  async createReminder(command: CreateReminderCommand): Promise<CreateReminderResult> {
    const taskDetail = await this.taskRepository.findById(command.userId, command.taskId);

    if (!taskDetail) {
      return { outcome: 'TASK_NOT_FOUND' };
    }

    const anchorDate = command.anchorType === 'PLANNED' ? taskDetail.task.plannedAt : taskDetail.task.dueAt;

    if (!anchorDate) {
      return { outcome: 'TASK_NO_TIME' };
    }

    let scheduledAt: Date;
    let offsetMinutes: number | null = null;
    let atTime: Date | null = null;

    if (command.ruleType === 'OFFSET') {
      if (command.offsetMinutes === undefined || command.offsetMinutes < 0) {
        return { outcome: 'TASK_NO_TIME' };
      }
      offsetMinutes = command.offsetMinutes;
      scheduledAt = new Date(anchorDate.getTime() - command.offsetMinutes * 60 * 1_000);
    } else {
      if (!command.atTime) {
        return { outcome: 'TASK_NO_TIME' };
      }
      atTime = new Date(command.atTime);
      scheduledAt = atTime;
    }

    const computedScheduledAt = scheduledAt;

    const existing = await this.reminderRepository.findRemindersByTask(command.userId, command.taskId);
    const isDuplicate = existing.some(
      (r) =>
        r.anchorType === command.anchorType &&
        r.ruleType === command.ruleType &&
        r.offsetMinutes === offsetMinutes &&
        r.atTime?.getTime() === atTime?.getTime(),
    );

    if (isDuplicate) {
      return { outcome: 'DUPLICATE_REMINDER' };
    }

    const reminder = await this.reminderRepository.createReminder(command.userId, command.taskId, {
      anchorType: command.anchorType,
      ruleType: command.ruleType,
      offsetMinutes,
      atTime,
      scheduledAt: computedScheduledAt,
    });

    return { outcome: 'SUCCESS', reminder };
  }

  async listReminders(userId: string, taskId: string): Promise<readonly TaskReminder[]> {
    return this.reminderRepository.findRemindersByTask(userId, taskId);
  }

  async cancelReminder(userId: string, reminderId: string): Promise<boolean> {
    return this.reminderRepository.cancelReminder(userId, reminderId);
  }
}
