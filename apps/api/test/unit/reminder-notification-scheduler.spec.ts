import { describe, expect, it, jest } from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';

import type { PushService } from '../../src/modules/planning/application/push.service';
import {
  ReminderNotificationSchedulerService,
  type DueReminder,
} from '../../src/modules/planning/application/reminder-notification-scheduler';
import type { ReminderRepository } from '../../src/modules/planning/infrastructure/reminder.repository';

const REMINDER_ID = '018f9f7c-0000-7000-8000-000000000001';
const TASK_ID = '018f9f7c-0000-7000-8000-000000000002';
const USER_ID = '018f9f7c-0000-7000-8000-000000000003';

describe('reminder notification scheduler', () => {
  it('skips reminders that failed the state claim', async () => {
    const reminders = repositoryMock();
    reminders.findDueReminders.mockResolvedValue([dueReminder()]);
    reminders.triggerReminder.mockResolvedValue(false);
    const push = pushServiceMock();
    const scheduler = new ReminderNotificationSchedulerService(
      reminders as unknown as ReminderRepository,
      push as unknown as PushService,
      loggerStub(),
    );

    await scheduler.runOnce();

    expect(reminders.triggerReminder).toHaveBeenCalledWith(REMINDER_ID);
    expect(reminders.createNotification).not.toHaveBeenCalled();
    expect(push.dispatchReminder).not.toHaveBeenCalled();
  });

  it('creates an in-app notification only when the user enables in-app reminders', async () => {
    const reminders = repositoryMock();
    reminders.findDueReminders.mockResolvedValue([
      dueReminder({ inAppReminderNotificationsEnabled: true }),
    ]);
    reminders.triggerReminder.mockResolvedValue(true);
    const push = pushServiceMock();
    push.dispatchReminder.mockResolvedValue({
      attempted: false,
      devices: 0,
      removedDevices: 0,
      failedDevices: 0,
    });
    const scheduler = new ReminderNotificationSchedulerService(
      reminders as unknown as ReminderRepository,
      push as unknown as PushService,
      loggerStub(),
    );

    await scheduler.runOnce();

    expect(reminders.createNotification).toHaveBeenCalledWith(
      USER_ID,
      REMINDER_ID,
      'Hatırlatma: Diş hekimi randevusu',
      'Bitiş: 13 Eyl 13:30',
    );
    expect(push.dispatchReminder).not.toHaveBeenCalled();
  });

  it('dispatches a web push for users with push enabled and tracks delivery', async () => {
    const reminders = repositoryMock();
    reminders.findDueReminders.mockResolvedValue([
      dueReminder({ pushReminderNotificationsEnabled: true, inAppReminderNotificationsEnabled: false }),
    ]);
    reminders.triggerReminder.mockResolvedValue(true);
    const push = pushServiceMock();
    push.dispatchReminder.mockResolvedValue({
      attempted: true,
      devices: 2,
      removedDevices: 0,
      failedDevices: 0,
    });
    const scheduler = new ReminderNotificationSchedulerService(
      reminders as unknown as ReminderRepository,
      push as unknown as PushService,
      loggerStub(),
    );

    await scheduler.runOnce();

    expect(reminders.createNotification).not.toHaveBeenCalled();
    expect(push.dispatchReminder).toHaveBeenCalledWith(USER_ID, {
      taskId: TASK_ID,
      title: 'Hatırlatma: Diş hekimi randevusu',
      body: 'Bitiş: 13 Eyl 13:30',
    });
    expect(reminders.markPushDelivered).toHaveBeenCalledWith(REMINDER_ID, expect.any(Date));
  });

  it('delivers to both channels when both preferences are enabled', async () => {
    const reminders = repositoryMock();
    reminders.findDueReminders.mockResolvedValue([
      dueReminder({ pushReminderNotificationsEnabled: true, inAppReminderNotificationsEnabled: true }),
    ]);
    reminders.triggerReminder.mockResolvedValue(true);
    const push = pushServiceMock();
    push.dispatchReminder.mockResolvedValue({
      attempted: true,
      devices: 1,
      removedDevices: 0,
      failedDevices: 0,
    });
    const scheduler = new ReminderNotificationSchedulerService(
      reminders as unknown as ReminderRepository,
      push as unknown as PushService,
      loggerStub(),
    );

    await scheduler.runOnce();

    expect(reminders.createNotification).toHaveBeenCalledWith(
      USER_ID,
      REMINDER_ID,
      expect.any(String),
      expect.any(String),
    );
    expect(push.dispatchReminder).toHaveBeenCalled();
    expect(reminders.markPushDelivered).toHaveBeenCalledWith(REMINDER_ID, expect.any(Date));
  });

  it('does not mark push delivery when the user has no registered devices', async () => {
    const reminders = repositoryMock();
    reminders.findDueReminders.mockResolvedValue([
      dueReminder({ pushReminderNotificationsEnabled: true, inAppReminderNotificationsEnabled: false }),
    ]);
    reminders.triggerReminder.mockResolvedValue(true);
    const push = pushServiceMock();
    push.dispatchReminder.mockResolvedValue({
      attempted: false,
      devices: 0,
      removedDevices: 0,
      failedDevices: 0,
    });
    const scheduler = new ReminderNotificationSchedulerService(
      reminders as unknown as ReminderRepository,
      push as unknown as PushService,
      loggerStub(),
    );

    await scheduler.runOnce();

    expect(push.dispatchReminder).toHaveBeenCalled();
    expect(reminders.markPushDelivered).not.toHaveBeenCalled();
  });
});

function dueReminder(
  preferences: {
    readonly inAppReminderNotificationsEnabled?: boolean;
    readonly pushReminderNotificationsEnabled?: boolean;
  } = {},
): DueReminder {
  return {
    anchorType: 'DUE',
    atTime: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    id: REMINDER_ID,
    offsetMinutes: 10,
    pushDeliveredAt: null,
    ruleType: 'OFFSET',
    scheduledAt: new Date('2026-09-13T10:20:00.000Z'),
    state: 'SCHEDULED',
    taskId: TASK_ID,
    task: {
      dueAt: new Date('2026-09-13T10:30:00.000Z'),
      id: TASK_ID,
      plannedAt: null,
      title: 'Diş hekimi randevusu',
    },
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    userId: USER_ID,
    user: {
      id: USER_ID,
      inAppReminderNotificationsEnabled:
        preferences.inAppReminderNotificationsEnabled ?? false,
      pushReminderNotificationsEnabled: preferences.pushReminderNotificationsEnabled ?? false,
      timeZone: 'Europe/Istanbul',
    },
    version: 1,
  };
}

function repositoryMock() {
  return {
    createNotification: jest.fn<ReminderRepository['createNotification']>(),
    findDueReminders: jest.fn<ReminderRepository['findDueReminders']>(),
    markPushDelivered: jest.fn<ReminderRepository['markPushDelivered']>(),
    triggerReminder: jest.fn<ReminderRepository['triggerReminder']>(),
    suppressReminder: jest.fn<ReminderRepository['suppressReminder']>(),
  };
}

function pushServiceMock() {
  return {
    dispatchReminder: jest.fn<PushService['dispatchReminder']>(),
  };
}

function loggerStub(): PinoLogger {
  return {
    assign: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}