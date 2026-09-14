import { apiClient } from '@planner/api-client';

import { apiError } from '@/features/auth/auth-api';

import type { PushRegistrationInput } from './push-manager';

export async function registerPushSubscription(input: PushRegistrationInput): Promise<void> {
  const result = await apiClient.post({
    url: '/api/v1/push-subscriptions',
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: input,
  });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const result = await apiClient.delete({
    url: '/api/v1/push-subscriptions',
    body: { endpoint },
  });

  if (result.error !== undefined && !isNotFoundError(result.error)) {
    throw apiError(result.error);
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 404
  );
}