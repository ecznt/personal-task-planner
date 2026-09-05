import { Inject, Injectable } from '@nestjs/common';

import { ReminderRepository } from '../infrastructure/reminder.repository';
import type { NotificationDetail } from '../domain/reminder.entity';

export type NotificationSummary = {
  readonly unreadCount: number;
  readonly latestAt: string | null;
};

@Injectable()
export class NotificationService {
  constructor(
    @Inject(ReminderRepository) private readonly reminderRepository: ReminderRepository,
  ) {}

  async listNotifications(
    userId: string,
    options: {
      readonly cursor?: string;
      readonly limit: number;
      readonly readState?: 'UNREAD' | 'READ';
    },
  ): Promise<{
    readonly data: readonly NotificationDetail[];
    readonly nextCursor?: string;
    readonly hasMore: boolean;
  }> {
    const result = await this.reminderRepository.findNotifications(userId, options);
    return {
      data: result.notifications,
      hasMore: result.nextCursor !== undefined,
      ...(result.nextCursor !== undefined && { nextCursor: result.nextCursor }),
    };
  }

  async getSummary(userId: string): Promise<NotificationSummary> {
    const unreadCount = await this.reminderRepository.getUnreadCount(userId);
    return {
      unreadCount,
      latestAt: null,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    return this.reminderRepository.markAsRead(userId, notificationId);
  }

  async markMultipleAsRead(userId: string, notificationIds: readonly string[]): Promise<number> {
    return this.reminderRepository.markMultipleAsRead(userId, notificationIds);
  }
}
