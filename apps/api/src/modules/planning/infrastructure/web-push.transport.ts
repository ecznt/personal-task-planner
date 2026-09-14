import { Inject, Injectable } from '@nestjs/common';
import webpush from 'web-push';

import {
  isPushConfigured,
  PUSH_VAPID_CONFIG,
  type PushVapidConfig,
} from '../application/push-vapid';
import type { PushSubscription } from '../domain/reminder.entity';

export const PUSH_TRANSPORT = Symbol('PUSH_TRANSPORT');

export type PushSendInput = {
  readonly endpoint: string;
  readonly keysP256dh: string;
  readonly keysAuth: string;
};

export interface PushTransport {
  send(input: PushSendInput, payload: string): Promise<void>;
}

@Injectable()
export class WebPushTransport implements PushTransport {
  constructor(
    @Inject(PUSH_VAPID_CONFIG) private readonly vapid: PushVapidConfig | null,
  ) {
    if (isPushConfigured(vapid)) {
      webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    }
  }

  async send(input: PushSendInput, payload: string): Promise<void> {
    await webpush.sendNotification(
      {
        endpoint: input.endpoint,
        keys: {
          p256dh: input.keysP256dh,
          auth: input.keysAuth,
        },
      },
      payload,
    );
  }
}

export function isRemovedPushError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('statusCode' in error && (error.statusCode === 410 || error.statusCode === 404)) {
    return true;
  }
  return 'status' in error && (error.status === 410 || error.status === 404);
}

export function pushSubscriptionToTransport(subscription: PushSubscription): PushSendInput {
  return {
    endpoint: subscription.endpoint,
    keysP256dh: subscription.keysP256dh,
    keysAuth: subscription.keysAuth,
  };
}