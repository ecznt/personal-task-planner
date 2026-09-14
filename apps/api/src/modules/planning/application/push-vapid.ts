import { parseWorkerEnvironment } from '../../../platform/config/environment';

export const PUSH_VAPID_CONFIG = Symbol('PUSH_VAPID_CONFIG');

export type PushVapidConfig = {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly subject: string;
};

export function pushVapidConfigFactory(): PushVapidConfig | null {
  const environment = parseWorkerEnvironment();

  if (
    !environment.VAPID_PUBLIC_KEY ||
    !environment.VAPID_PRIVATE_KEY ||
    !environment.VAPID_SUBJECT
  ) {
    return null;
  }

  return {
    publicKey: environment.VAPID_PUBLIC_KEY,
    privateKey: environment.VAPID_PRIVATE_KEY,
    subject: environment.VAPID_SUBJECT,
  };
}

export function isPushConfigured(
  config: PushVapidConfig | null | undefined,
): config is PushVapidConfig {
  return (
    config !== null &&
    config !== undefined &&
    config.publicKey.length > 0 &&
    config.privateKey.length > 0 &&
    config.subject.length > 0
  );
}