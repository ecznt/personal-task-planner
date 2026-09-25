import {
  apiClient,
  getFocusStatistics,
  listFocusSessions,
  recordFocusSession,
  type CreateFocusSessionRequestDto,
} from '@planner/api-client';

import { apiError } from '@/features/auth/auth-api';

import type { FocusSession, FocusStatistics, PendingFocusRecord } from './focus-types';

export const focusSessionsQueryKey = ['focus', 'sessions'] as const;
export const focusStatisticsQueryKey = ['focus', 'statistics'] as const;

export async function fetchFocusStatistics(): Promise<FocusStatistics> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const result = await getFocusStatistics({ client: apiClient, query: { timezone } });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  if (result.data?.data === undefined) {
    throw new Error('Odak istatistikleri yüklenemedi.');
  }

  return result.data.data;
}

export async function fetchFocusSessions(): Promise<FocusSession[]> {
  const result = await listFocusSessions({ client: apiClient, query: { limit: 12 } });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  return result.data?.data ?? [];
}

export async function postFocusSession(payload: PendingFocusRecord, csrfToken: string): Promise<void> {
  const body: CreateFocusSessionRequestDto = {
    startedAt: payload.startedAt,
    completedAt: payload.completedAt,
    durationMinutes: payload.durationMinutes,
    clientKey: payload.clientKey,
  };

  const result = await recordFocusSession({
    client: apiClient,
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Idempotency-Key': crypto.randomUUID(),
    },
  });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }
}