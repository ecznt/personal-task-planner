import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { PushSubscriptionRepository } from '../infrastructure/push-subscription.repository';
import {
  isRemovedPushError,
  PUSH_TRANSPORT,
  pushSubscriptionToTransport,
  type PushTransport,
} from '../infrastructure/web-push.transport';
import { isPushConfigured, PUSH_VAPID_CONFIG, type PushVapidConfig } from './push-vapid';
import type { PushSubscription } from '../domain/reminder.entity';

export type ReminderPushInput = {
  readonly taskId: string;
  readonly title: string;
  readonly body: string | null;
};

export type PushDispatchResult = {
  readonly attempted: boolean;
  readonly devices: number;
  readonly removedDevices: number;
  readonly failedDevices: number;
};

@Injectable()
export class PushService {
  constructor(
    @Inject(PushSubscriptionRepository)
    private readonly subscriptions: PushSubscriptionRepository,
    @Inject(PUSH_TRANSPORT) private readonly transport: PushTransport,
    @Inject(PUSH_VAPID_CONFIG) private readonly vapid: PushVapidConfig | null,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PushService.name);
  }

  async enroll(
    userId: string,
    input: {
      readonly endpoint: string;
      readonly keysP256dh: string;
      readonly keysAuth: string;
    },
  ): Promise<PushSubscription> {
    return this.subscriptions.upsert(userId, input);
  }

  async remove(userId: string, endpoint: string): Promise<boolean> {
    return this.subscriptions.removeByEndpoint(userId, endpoint);
  }

  async hasSubscriptions(userId: string): Promise<boolean> {
    return (await this.subscriptions.countForUser(userId)) > 0;
  }

  async dispatchReminder(
    userId: string,
    input: ReminderPushInput,
  ): Promise<PushDispatchResult> {
    if (!isPushConfigured(this.vapid)) {
      return { attempted: false, devices: 0, removedDevices: 0, failedDevices: 0 };
    }

    const subscriptions = await this.subscriptions.listForUser(userId);
    if (subscriptions.length === 0) {
      return { attempted: false, devices: 0, removedDevices: 0, failedDevices: 0 };
    }

    const payload = JSON.stringify({
      type: 'REMINDER',
      title: input.title,
      body: input.body,
      url: `/app/areas/tasks/${input.taskId}`,
    });

    let removedDevices = 0;
    let failedDevices = 0;
    const removals: string[] = [];

    for (const subscription of subscriptions) {
      try {
        await this.transport.send(pushSubscriptionToTransport(subscription), payload);
      } catch (error) {
        if (isRemovedPushError(error)) {
          removedDevices += 1;
          removals.push(subscription.id);
        } else {
          failedDevices += 1;
          this.logger.warn({ error: errorToString(error) }, 'web push delivery failed');
        }
      }
    }

    if (removals.length > 0) {
      await this.subscriptions.removeMany(removals);
    }

    return {
      attempted: true,
      devices: subscriptions.length,
      removedDevices,
      failedDevices,
    };
  }
}

function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'UNKNOWN';
}