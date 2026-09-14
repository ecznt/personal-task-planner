import { describe, expect, it } from 'vitest';

import {
  pushSubscriptionToRegistration,
  urlBase64ToUint8Array,
} from './push-manager';

describe('push manager', () => {
  it('decodes a base64url VAPID key into bytes', () => {
    const bytes = urlBase64ToUint8Array('dGVzdHRlc3Q');
    expect(Array.from(bytes)).toEqual([
      116, 101, 115, 116, 116, 101, 115, 116,
    ]);
  });

  it('decodes a padded VAPID key with url-safe characters', () => {
    const bytes = urlBase64ToUint8Array('AQID');
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });

  it('converts a push subscription into the registration payload shape', () => {
    const p256dh = new Uint8Array([200, 3, 9]).buffer;
    const auth = new Uint8Array([5, 6, 7]).buffer;
    const subscription = {
      endpoint: 'https://push.example.com/device-1',
      getKey: (key: 'p256dh' | 'auth') => (key === 'p256dh' ? p256dh : auth),
    } as unknown as PushSubscription;

    expect(pushSubscriptionToRegistration(subscription)).toEqual({
      endpoint: 'https://push.example.com/device-1',
      keys: {
        p256dh: 'yAMJ',
        auth: 'BQYH',
      },
    });
  });
});