import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { Notification, NotificationDetail, TaskReminder } from '../domain/reminder.entity';

@Injectable()
export class ReminderRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createReminder(
    userId: string,
    taskId: string,
    input: {
      readonly anchorType: 'PLANNED' | 'DUE';
      readonly ruleType: 'OFFSET' | 'AT_TIME';
      readonly offsetMinutes: number | null;
      readonly atTime: Date | null;
      readonly scheduledAt: Date;
    },
  ): Promise<TaskReminder> {
    return this.prisma.taskReminder.create({
      data: {
        userId,
        taskId,
        anchorType: input.anchorType,
        ruleType: input.ruleType,
        offsetMinutes: input.offsetMinutes,
        atTime: input.atTime,
        scheduledAt: input.scheduledAt,
      },
    });
  }

  async findRemindersByTask(userId: string, taskId: string): Promise<readonly TaskReminder[]> {
    return this.prisma.taskReminder.findMany({
      where: { userId, taskId, state: { in: ['SCHEDULED', 'PAUSED'] } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findReminderById(userId: string, reminderId: string): Promise<TaskReminder | null> {
    return this.prisma.taskReminder.findFirst({
      where: { id: reminderId, userId },
    });
  }

  async cancelReminder(userId: string, reminderId: string): Promise<boolean> {
    const result = await this.prisma.taskReminder.updateMany({
      where: { id: reminderId, userId, state: { in: ['SCHEDULED', 'PAUSED'] } },
      data: { state: 'CANCELLED', version: { increment: 1 } },
    });
    return result.count > 0;
  }

  async findDueReminders(now: Date): Promise<
    readonly (TaskReminder & {
      readonly user: { readonly id: string; readonly inAppReminderNotificationsEnabled: boolean };
    })[]
  > {
    return this.prisma.taskReminder.findMany({
      where: {
        state: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        user: {
          select: { id: true, inAppReminderNotificationsEnabled: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100,
    });
  }

  async triggerReminder(reminderId: string): Promise<boolean> {
    const result = await this.prisma.taskReminder.updateMany({
      where: { id: reminderId, state: 'SCHEDULED' },
      data: { state: 'TRIGGERED', version: { increment: 1 } },
    });
    return result.count > 0;
  }

  async suppressReminder(reminderId: string): Promise<boolean> {
    const result = await this.prisma.taskReminder.updateMany({
      where: { id: reminderId, state: 'SCHEDULED' },
      data: { state: 'SUPPRESSED', version: { increment: 1 } },
    });
    return result.count > 0;
  }

  async recalculateScheduledAt(reminderId: string, newScheduledAt: Date): Promise<boolean> {
    const result = await this.prisma.taskReminder.updateMany({
      where: { id: reminderId, state: { in: ['SCHEDULED', 'PAUSED'] } },
      data: { scheduledAt: newScheduledAt, version: { increment: 1 } },
    });
    return result.count > 0;
  }

  async createNotification(
    userId: string,
    taskReminderId: string,
    title: string,
    body: string | null,
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        taskReminderId,
        title,
        body,
      },
    });
  }

  async findNotificationById(userId: string, notificationId: string): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
  }

  async findNotifications(
    userId: string,
    options: {
      readonly cursor?: string;
      readonly limit: number;
      readonly readState?: 'UNREAD' | 'READ';
    },
  ): Promise<{
    readonly notifications: readonly NotificationDetail[];
    readonly nextCursor?: string;
  }> {
    const where: Record<string, unknown> = { userId };

    if (options.readState) {
      where.readState = options.readState;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit + 1,
      ...(options.cursor !== undefined && { cursor: { id: options.cursor } }),
      include: {
        taskReminder: {
          include: {
            task: {
              select: { title: true, dueAt: true },
            },
          },
        },
      },
    });

    const hasMore = notifications.length > options.limit;
    const lastFetched = hasMore ? notifications.at(options.limit) : undefined;
    const nextCursor = lastFetched?.id;
    const sliced = notifications.slice(0, options.limit);

    const results: NotificationDetail[] = sliced.map((n) => ({
      id: n.id,
      userId: n.userId,
      taskReminderId: n.taskReminderId,
      title: n.title,
      body: n.body,
      readState: n.readState,
      version: n.version,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      taskTitle: n.taskReminder.task.title,
      taskDueAt: n.taskReminder.task.dueAt,
    }));

    return { notifications: results, ...(nextCursor !== undefined && { nextCursor }) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readState: 'UNREAD' },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readState: 'UNREAD' },
      data: { readState: 'READ', version: { increment: 1 } },
    });
    return result.count > 0;
  }

  async markMultipleAsRead(userId: string, notificationIds: readonly string[]): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: [...notificationIds] }, userId, readState: 'UNREAD' },
      data: { readState: 'READ', version: { increment: 1 } },
    });
    return result.count;
  }

  async findNotificationByReminderId(
    userId: string,
    taskReminderId: string,
  ): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: { userId, taskReminderId },
    });
  }
}
