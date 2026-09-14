const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export function applicationServerKeyConfigured(): boolean {
  return VAPID_PUBLIC_KEY.length > 0;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    applicationServerKeyConfigured()
  );
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export type PushRegistrationInput = {
  readonly endpoint: string;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
};

export function pushSubscriptionToRegistration(
  subscription: PushSubscription,
): PushRegistrationInput {
  const p256dh = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dh === null ? '' : arrayBufferToBase64Url(p256dh),
      auth: auth === null ? '' : arrayBufferToBase64Url(auth),
    },
  };
}

function arrayBufferToBase64Url(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function obtainPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const existing = await registration.pushManager.getSubscription();

  if (existing !== null) {
    return existing;
  }

  return registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    userVisibleOnly: true,
  });
}

export async function unregisterPushSubscriptionLocally(): Promise<string> {
  if (!isPushSupported()) {
    return '';
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.getSubscription();

  if (subscription === null) {
    return '';
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}