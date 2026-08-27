'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type BulkActionResult = {
  readonly taskId: string;
  readonly status: 'SUCCEEDED' | 'FAILED';
  readonly version?: number;
  readonly etag?: string;
  readonly errorCode?: string;
  readonly errorDetail?: string;
};

type BulkActionsResponse = {
  readonly results: readonly BulkActionResult[];
};

type TaskItem = {
  readonly id: string;
  readonly version: number;
};

const STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'Yapılacak' },
  { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { value: 'COMPLETED', label: 'Tamamlandı' },
] as const;

type BulkActionBarProps = {
  readonly selectedTasks: readonly TaskItem[];
  readonly onClearSelection: () => void;
  readonly onResult: (result: { succeeded: number; failed: number }) => void;
};

export function BulkActionBar({ selectedTasks, onClearSelection, onResult }: BulkActionBarProps) {
  const queryClient = useQueryClient();

  const bulkStatusChange = useMutation({
    mutationFn: async (targetCanonicalStatus: string) => {
      const csrf = (await fetchCsrf()).token;
      queryClient.setQueryData(csrfQueryKey, csrf);

      const items = selectedTasks.map((t) => ({
        taskId: t.id,
        etag: String(t.version),
      }));

      const result = await apiClient.post({
        url: '/api/v1/tasks/bulk-actions',
        body: {
          operation: 'status_change',
          items,
          targetCanonicalStatus,
        },
        headers: {
          'X-CSRF-Token': csrf,
          'Idempotency-Key': `bulk-status-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data as BulkActionsResponse;
    },
    onSuccess: (data) => {
      const succeeded = data.results.filter((r) => r.status === 'SUCCEEDED').length;
      const failed = data.results.filter((r) => r.status === 'FAILED').length;
      onResult({ succeeded, failed });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
      onClearSelection();
    },
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedTasks.length} görev seçildi
        </div>
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              onClick={() => bulkStatusChange.mutate(opt.value)}
              disabled={bulkStatusChange.isPending}
              className="transition-transform duration-150 active:scale-[0.97]"
            >
              {bulkStatusChange.isPending ? (
                <Spinner className="h-3 w-3" />
              ) : (
                opt.label
              )}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="transition-transform duration-150 active:scale-[0.97]"
          >
            İptal
          </Button>
        </div>
      </div>
    </div>
  );
}
