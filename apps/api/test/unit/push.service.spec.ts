import { describe, expect, it, jest } from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';

import { PushService } from '../../src/modules/planning/application/push.service';
import type { PushSubscriptionRepository } from '../../src/modules/planning/infrastructure/push-subscription.repository';
import type { PushTransport } from '../../src/modules/planning/infrastructure/web-push.transport';

describe('push service', () => {
  it('skips dispatch when VAPID is not configured', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest.fn<PushSubscriptionRepository['listForUser']>(),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest.fn<PushSubscriptionRepository['upsert']>(),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transportStub(),
      null,
      loggerStub(),
    );

    const result = await service.dispatchReminder('user-1', {
      taskId: 'task-1',
      title: 'Hatırlatma: Diş hekimi',
      body: 'Bitiş: 13 Eyl 13:30',
    });

    expect(result).toEqual({ attempted: false, devices: 0, removedDevices: 0, failedDevices: 0 });
    expect(subscriptions.listForUser).not.toHaveBeenCalled();
  });

  it('skips dispatch when the user has no subscriptions', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest.fn<PushSubscriptionRepository['listForUser']>().mockResolvedValue([]),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest.fn<PushSubscriptionRepository['upsert']>(),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transportStub(),
      vapidConfig(),
      loggerStub(),
    );

    const result = await service.dispatchReminder('user-1', {
      taskId: 'task-1',
      title: 'Hatırlatma: Diş hekimi',
      body: 'Bitiş: 13 Eyl 13:30',
    });

    expect(result).toEqual({ attempted: false, devices: 0, removedDevices: 0, failedDevices: 0 });
  });

  it('sends a reminder payload to every device and reports the outcome', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest
        .fn<PushSubscriptionRepository['listForUser']>()
        .mockResolvedValue([
          {
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            endpoint: 'https://push.example.com/device-1',
            id: 'd1',
            keysAuth: 'auth-1',
            keysP256dh: 'p256-1',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            userId: 'user-1',
          },
        ]),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest.fn<PushSubscriptionRepository['upsert']>(),
    };
    const transport = {
      send: jest.fn<PushTransport['send']>().mockResolvedValue(undefined),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transport,
      vapidConfig(),
      loggerStub(),
    );

    const result = await service.dispatchReminder('user-1', {
      taskId: 'task-1',
      title: 'Hatırlatma: Diş hekimi',
      body: 'Bitiş: 13 Eyl 13:30',
    });

    expect(transport.send).toHaveBeenCalledWith(
      { endpoint: 'https://push.example.com/device-1', keysAuth: 'auth-1', keysP256dh: 'p256-1' },
      JSON.stringify({
        type: 'REMINDER',
        title: 'Hatırlatma: Diş hekimi',
        body: 'Bitiş: 13 Eyl 13:30',
        url: '/app/areas/tasks/task-1',
      }),
    );
    expect(result).toEqual({ attempted: true, devices: 1, removedDevices: 0, failedDevices: 0 });
    expect(subscriptions.removeMany).not.toHaveBeenCalled();
  });

  it('removes permanently-gone devices and still counts the rest', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest
        .fn<PushSubscriptionRepository['listForUser']>()
        .mockResolvedValue([
          {
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            endpoint: 'https://push.example.com/gone',
            id: 'd1',
            keysAuth: 'auth-1',
            keysP256dh: 'p256-1',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            userId: 'user-1',
          },
          {
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            endpoint: 'https://push.example.com/ok',
            id: 'd2',
            keysAuth: 'auth-2',
            keysP256dh: 'p256-2',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            userId: 'user-1',
          },
        ]),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest.fn<PushSubscriptionRepository['upsert']>(),
    };
    const transport = {
      send: jest
        .fn<PushTransport['send']>()
        .mockRejectedValueOnce(goneError(410))
        .mockResolvedValueOnce(undefined),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transport,
      vapidConfig(),
      loggerStub(),
    );

    const result = await service.dispatchReminder('user-1', {
      taskId: 'task-1',
      title: 'Hatırlatma: Diş hekimi',
      body: 'Bitiş: 13 Eyl 13:30',
    });

    expect(result).toEqual({ attempted: true, devices: 2, removedDevices: 1, failedDevices: 0 });
    expect(subscriptions.removeMany).toHaveBeenCalledWith(['d1']);
  });

  it('counts transient failures without removing devices', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest
        .fn<PushSubscriptionRepository['listForUser']>()
        .mockResolvedValue([
          {
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            endpoint: 'https://push.example.com/device-1',
            id: 'd1',
            keysAuth: 'auth-1',
            keysP256dh: 'p256-1',
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            userId: 'user-1',
          },
        ]),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest.fn<PushSubscriptionRepository['upsert']>(),
    };
    const transport = {
      send: jest.fn<PushTransport['send']>().mockRejectedValue(new Error('network down')),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transport,
      vapidConfig(),
      loggerStub(),
    );

    const result = await service.dispatchReminder('user-1', {
      taskId: 'task-1',
      title: 'Hatırlatma: Diş hekimi',
      body: 'Bitiş: 13 Eyl 13:30',
    });

    expect(result).toEqual({ attempted: true, devices: 1, removedDevices: 0, failedDevices: 1 });
    expect(subscriptions.removeMany).not.toHaveBeenCalled();
  });

  it('enrolls and removes subscriptions through the repository', async () => {
    const subscriptions = {
      countForUser: jest.fn<PushSubscriptionRepository['countForUser']>(),
      listForUser: jest.fn<PushSubscriptionRepository['listForUser']>(),
      removeByEndpoint: jest.fn<PushSubscriptionRepository['removeByEndpoint']>(),
      removeMany: jest.fn<PushSubscriptionRepository['removeMany']>(),
      upsert: jest
        .fn<PushSubscriptionRepository['upsert']>()
        .mockResolvedValue({
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          endpoint: 'https://push.example.com/device-1',
          id: 'd1',
          keysAuth: 'auth-1',
          keysP256dh: 'p256-1',
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          userId: 'user-1',
        }),
    };
    const service = new PushService(
      subscriptions as unknown as PushSubscriptionRepository,
      transportStub(),
      vapidConfig(),
      loggerStub(),
    );

    await service.enroll('user-1', {
      endpoint: 'https://push.example.com/device-1',
      keysP256dh: 'p256-1',
      keysAuth: 'auth-1',
    });

    expect(subscriptions.upsert).toHaveBeenCalledWith('user-1', {
      endpoint: 'https://push.example.com/device-1',
      keysP256dh: 'p256-1',
      keysAuth: 'auth-1',
    });

    await service.remove('user-1', 'https://push.example.com/device-1');

    expect(subscriptions.removeByEndpoint).toHaveBeenCalledWith(
      'user-1',
      'https://push.example.com/device-1',
    );
  });
});

function vapidConfig() {
  return { publicKey: 'public', privateKey: 'private', subject: 'https://example.com' };
}

function transportStub(): PushTransport {
  return { send: jest.fn<PushTransport['send']>() };
}

function loggerStub(): PinoLogger {
  return {
    setContext: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    assign: jest.fn(),
  } as unknown as PinoLogger;
}

function goneError(statusCode: number) {
  const error = new Error('gone');
  return Object.assign(error, { statusCode });
}