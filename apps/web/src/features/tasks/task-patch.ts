'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { apiClient } from '@planner/api-client';
import { apiError, AuthApiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

export type LabelSummary = {
  readonly id: string;
  readonly name: string;
};

export type ChecklistItem = {
  readonly id: string;
  readonly text: string;
  readonly position: number;
  readonly completed: boolean;
};

export type RecurrenceInfo = {
  readonly series: {
    readonly id: string;
    readonly state: string;
    readonly currentOpenTaskId: string | null;
    readonly nextOccurrenceNumber: number;
  };
  readonly activeRule: {
    readonly id: string;
    readonly mode: string;
    readonly frequency: string;
    readonly interval: number;
    readonly selectedWeekdays: readonly number[];
    readonly dayOfMonth: number | null;
    readonly monthOfYear: number | null;
    readonly localTime: string | null;
  };
  readonly currentOpenTaskId: string | null;
} | null;

export type TaskData = {
  readonly id: string;
  readonly areaId: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: string | null;
  readonly dueAt: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly areaStatusId: string;
  readonly canonicalStatus: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly labels: readonly LabelSummary[];
  readonly checklistItems: readonly ChecklistItem[];
  readonly projectId: string | null;
  readonly recurrence: RecurrenceInfo;
};

export type TaskPatchBody = Record<string, unknown>;

export type TaskSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type TaskPatchApi = {
  readonly saveFields: (body: TaskPatchBody) => void;
  readonly status: TaskSaveStatus;
  readonly error: string | null;
  readonly clearError: () => void;
};

export function taskDetailQueryKey(taskId: string): readonly ['areas', 'tasks', string] {
  return ['areas', 'tasks', taskId] as const;
}

export function readTaskFromCache(
  queryClient: QueryClient,
  taskId: string,
): TaskData | undefined {
  return queryClient.getQueryData<{ data: TaskData }>(taskDetailQueryKey(taskId))?.data;
}

export function invalidateTaskCaches(
  queryClient: QueryClient,
  taskData: Pick<TaskData, 'areaId'>,
): void {
  queryClient.invalidateQueries({ queryKey: ['areas', 'tasks'] });
  queryClient.invalidateQueries({ queryKey: ['areas', taskData.areaId, 'tasks'] });
  queryClient.invalidateQueries({ queryKey: ['areas', taskData.areaId, 'kanban'] });
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
}

function isVersionConflict(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === 'VERSION_CONFLICT';
}

export function useTaskPatch({ taskId }: { readonly taskId: string }): TaskPatchApi {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskSaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<TaskPatchBody | null>(null);
  const inFlightRef = useRef(false);
  const savedTimerRef = useRef<number | null>(null);

  const flushOne = useCallback(
    async (body: TaskPatchBody): Promise<void> => {
      const key = taskDetailQueryKey(taskId);
      const current = readTaskFromCache(queryClient, taskId);

      if (current === undefined) {
        throw new Error('Görev bulunamadı.');
      }

      const previous = queryClient.getQueryData<{ data: TaskData }>(key);

      queryClient.setQueryData<{ data: TaskData }>(key, (old) => {
        if (old === undefined) return old;
        const next = { ...old.data };
        for (const [field, value] of Object.entries(body)) {
          (next as Record<string, unknown>)[field] = value;
        }
        return { data: next };
      });

      try {
        const csrf = await fetchCsrf();
        queryClient.setQueryData(csrfQueryKey, csrf);

        const result = await apiClient.patch({
          url: '/api/v1/tasks/{taskId}',
          path: { taskId },
          body,
          headers: {
            'X-CSRF-Token': csrf.token,
            'If-Match': String(current.version),
          },
        });

        if (result.error !== undefined) {
          throw apiError(result.error);
        }

        const updated = (result.data as { data: TaskData }).data;
        queryClient.setQueryData<{ data: TaskData }>(key, { data: updated });
        invalidateTaskCaches(queryClient, updated);
      } catch (err) {
        if (previous !== undefined) {
          queryClient.setQueryData<{ data: TaskData }>(key, previous);
        }

        if (isVersionConflict(err)) {
          queryClient.invalidateQueries({ queryKey: key });
          setStatus('error');
          setError('Görev başka bir yerde güncellendi. En güncel değerler yüklendi.');
        } else {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
        }

        throw err;
      }
    },
    [queryClient, taskId],
  );

  const saveFields = useCallback(
    (body: TaskPatchBody): void => {
      setError(null);

      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }

      pendingRef.current = { ...(pendingRef.current ?? {}), ...body };

      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setStatus('saving');

      void (async () => {
        try {
          while (pendingRef.current !== null) {
            const next = pendingRef.current;
            pendingRef.current = null;
            await flushOne(next);
          }

          setStatus('saved');

          if (savedTimerRef.current !== null) {
            window.clearTimeout(savedTimerRef.current);
          }

          savedTimerRef.current = window.setTimeout(() => {
            setStatus('idle');
          }, 1800);
        } finally {
          inFlightRef.current = false;
        }
      })().catch(() => {
        // Hata zaten status/error durumu aracılığıyla yüzeye çıkarıldı.
      });
    },
    [flushOne],
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  return { saveFields, status, error, clearError };
}