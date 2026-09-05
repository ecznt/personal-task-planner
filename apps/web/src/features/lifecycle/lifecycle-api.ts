import { apiClient } from '@planner/api-client';
import type { QueryClient } from '@tanstack/react-query';

import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

export type ResourceType = 'areas' | 'projects' | 'tasks';

async function withCsrf(queryClient: QueryClient): Promise<string> {
  const token = (await fetchCsrf()).token;
  queryClient.setQueryData(csrfQueryKey, token);
  return token;
}

function idemKey(prefix: string, id: string): string {
  return `${prefix}-${id}-${Date.now()}`;
}

type CommandOptions = {
  readonly resourceType: ResourceType;
  readonly id: string;
  readonly version: number;
};

export async function archiveResource(
  { resourceType, id, version }: CommandOptions,
  queryClient: QueryClient,
): Promise<void> {
  const csrf = await withCsrf(queryClient);
  const result = await apiClient.post({
    url: `/api/v1/${resourceType}/{id}/archive`,
    path: { id },
    body: { confirmCascade: true },
    headers: {
      'X-CSRF-Token': csrf,
      'If-Match': String(version),
      'Idempotency-Key': idemKey('archive', id),
    },
  });
  if (result.error !== undefined) throw apiError(result.error);
}

export async function trashResource(
  { resourceType, id, version }: CommandOptions,
  queryClient: QueryClient,
): Promise<void> {
  const csrf = await withCsrf(queryClient);
  const result = await apiClient.post({
    url: `/api/v1/${resourceType}/{id}/trash`,
    path: { id },
    body: { confirmCascade: true },
    headers: {
      'X-CSRF-Token': csrf,
      'If-Match': String(version),
      'Idempotency-Key': idemKey('trash', id),
    },
  });
  if (result.error !== undefined) throw apiError(result.error);
}

export async function restoreResource(
  options: CommandOptions & {
    readonly replacementAreaId?: string;
    readonly replacementProjectId?: string;
  },
  queryClient: QueryClient,
): Promise<void> {
  const { resourceType, id, version, replacementAreaId, replacementProjectId } = options;
  const csrf = await withCsrf(queryClient);
  const result = await apiClient.post({
    url: `/api/v1/archive/{resourceType}/{id}/restore`,
    path: { resourceType, id },
    body: {
      ...(replacementAreaId !== undefined && { replacementAreaId }),
      ...(replacementProjectId !== undefined && { replacementProjectId }),
    },
    headers: {
      'X-CSRF-Token': csrf,
      'If-Match': String(version),
      'Idempotency-Key': idemKey('restore', id),
    },
  });
  if (result.error !== undefined) throw apiError(result.error);
}

export async function restoreFromTrashResource(
  options: CommandOptions & {
    readonly replacementAreaId?: string;
    readonly replacementProjectId?: string;
  },
  queryClient: QueryClient,
): Promise<void> {
  const { resourceType, id, version, replacementAreaId, replacementProjectId } = options;
  const csrf = await withCsrf(queryClient);
  const result = await apiClient.post({
    url: `/api/v1/trash/{resourceType}/{id}/restore`,
    path: { resourceType, id },
    body: {
      ...(replacementAreaId !== undefined && { replacementAreaId }),
      ...(replacementProjectId !== undefined && { replacementProjectId }),
    },
    headers: {
      'X-CSRF-Token': csrf,
      'If-Match': String(version),
      'Idempotency-Key': idemKey('restore', id),
    },
  });
  if (result.error !== undefined) throw apiError(result.error);
}

export async function permanentDeleteResource(
  { resourceType, id, version }: CommandOptions,
  queryClient: QueryClient,
): Promise<void> {
  const csrf = await withCsrf(queryClient);
  const result = await apiClient.post({
    url: `/api/v1/trash/{resourceType}/{id}/permanent-deletions`,
    path: { resourceType, id },
    body: { confirmPermanentDelete: true },
    headers: {
      'X-CSRF-Token': csrf,
      'If-Match': String(version),
      'Idempotency-Key': idemKey('purge', id),
    },
  });
  if (result.error !== undefined) throw apiError(result.error);
}
