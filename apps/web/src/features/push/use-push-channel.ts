'use client';

import { useCallback, useEffect, useState } from 'react';

import { registerPushSubscription, removePushSubscription } from './push-client';
import {
  isPushSupported,
  obtainPushSubscription,
  pushSubscriptionToRegistration,
  unregisterPushSubscriptionLocally,
} from './push-manager';

export type PushChannelOutcome = 'granted' | 'denied' | 'unsupported' | 'not-configured';

export function usePushChannel(preferenceEnabled: boolean) {
  const [state, setState] = useState<'idle' | 'syncing' | 'active' | 'blocked' | 'unsupported'>(
    'idle',
  );

  useEffect(() => {
    if (!preferenceEnabled || !isPushSupported()) {
      return undefined;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return undefined;
    }

    let cancelled = false;

    obtainPushSubscription()
      .then((subscription) => {
        if (cancelled || subscription === null) {
          return;
        }
        return registerPushSubscription(pushSubscriptionToRegistration(subscription));
      })
      .catch(() => {
        // A silent best-effort sync; the user can retry from settings.
      });

    return () => {
      cancelled = true;
    };
  }, [preferenceEnabled]);

  const enable = useCallback(async (): Promise<PushChannelOutcome> => {
    if (!isPushSupported()) {
      setState('unsupported');
      return 'unsupported';
    }

    setState('syncing');

    let permission: NotificationPermission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      setState('blocked');
      return 'denied';
    }

    const subscription = await obtainPushSubscription();

    if (subscription === null) {
      setState('blocked');
      return 'denied';
    }

    await registerPushSubscription(pushSubscriptionToRegistration(subscription));
    setState('active');
    return 'granted';
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    const endpoint = await unregisterPushSubscriptionLocally();

    if (endpoint.length > 0) {
      await removePushSubscription(endpoint);
    }

    setState('idle');
  }, []);

  return { disable, enable, state };
}