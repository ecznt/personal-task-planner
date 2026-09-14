import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { PushService } from './push.service';
import { buildReminderBody, buildReminderTitle } from './reminder-message';
import { ReminderRepository } from '../infrastructure/reminder.repository';
import type { TaskReminder } from '../domain/reminder.entity';

const REMINDER_DISPATCH_INTERVAL_MS = 15_000;

export type DueReminder = TaskReminder & {
  readonly user: {
    readonly id: string;
    readonly timeZone: string;
    readonly inAppReminderNotificationsEnabled: boolean;
    readonly pushReminderNotificationsEnabled: boolean;
  };
  readonly task: {
    readonly id: string;
    readonly title: string;
    readonly dueAt: Date | null;
    readonly plannedAt: Date | null;
  };
};

@Injectable()
export class ReminderNotificationSchedulerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private interval: NodeJS.Timeout | undefined;

  constructor(
    @Inject(ReminderRepository) private readonly reminders: ReminderRepository,
    @Inject(PushService) private readonly pushService: PushService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReminderNotificationSchedulerService.name);
  }

  onApplicationBootstrap(): void {
    this.interval = setInterval(() => {
      void this.runOnce();
    }, REMINDER_DISPATCH_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
    }
  }

  async runOnce(): Promise<void> {
    const due = await this.reminders.findDueReminders(new Date());

    for (const reminder of due) {
      const claimed = await this.reminders.triggerReminder(reminder.id);
      if (!claimed) continue;

      try {
        await this.processClaimed(reminder);
      } catch (error) {
        this.logger.warn(
          { reminderId: reminder.id, error: errorMessage(error) },
          'failed to deliver reminder',
        );
      }
    }

    if (due.length > 0) {
      this.logger.debug({ due: due.length }, 'reminder dispatch pass completed');
    }
  }

  private async processClaimed(reminder: DueReminder): Promise<void> {
    const anchorInstant =
      reminder.anchorType === 'PLANNED'
        ? reminder.task.plannedAt ?? reminder.scheduledAt
        : reminder.task.dueAt ?? reminder.scheduledAt;

    const title = buildReminderTitle(reminder.task.title);
    const body = buildReminderBody(
      {
        anchorType: reminder.anchorType,
        taskTitle: reminder.task.title,
        anchorInstant,
      },
      reminder.user.timeZone,
    );

    if (reminder.user.inAppReminderNotificationsEnabled) {
      await this.reminders.createNotification(reminder.userId, reminder.id, title, body);
    }

    if (reminder.user.pushReminderNotificationsEnabled) {
      const result = await this.pushService.dispatchReminder(reminder.userId, {
        taskId: reminder.task.id,
        title,
        body,
      });

      if (result.attempted && result.devices > 0) {
        await this.reminders.markPushDelivered(reminder.id, new Date());
      }
    }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'UNKNOWN';
}