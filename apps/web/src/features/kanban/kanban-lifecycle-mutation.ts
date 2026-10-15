'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { archiveResource, trashResource } from '@/features/lifecycle/lifecycle-api';

export type LifecycleDropVariables = {
  action: 'archive' | 'trash';
  taskId: string;
  version: number;
  fromColumn: string;
};

type KanbanLifecycleMutationOptions<TBoard> = {
  /** Exact query key of the cached board payload. */
  readonly dataKey: readonly unknown[];
  /** Query key prefix to cancel while snapshotting optimistic state. */
  readonly cancelKey: readonly unknown[];
  /** Query keys to invalidate once the mutation settles. */
  readonly invalidateKeys: readonly (readonly unknown[])[];
  /** Pure optimistic update applied to the cached board payload. */
  readonly update: (old: TBoard, taskId: string, fromColumn: string) => TBoard;
};

/**
 * Shared archive/trash mutation for kanban boards. The two board variants cache
 * different payload shapes, so the optimistic update is injected while the
 * request, rollback, and invalidation behavior stay in one place.
 */
export function useKanbanLifecycleMutation<TBoard>({
  dataKey,
  cancelKey,
  invalidateKeys,
  update,
}: KanbanLifecycleMutationOptions<TBoard>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, taskId, version }: LifecycleDropVariables) => {
      if (action === 'trash') {
        return trashResource({ resourceType: 'tasks', id: taskId, version }, queryClient);
      }
      return archiveResource({ resourceType: 'tasks', id: taskId, version }, queryClient);
    },
    onMutate: async ({ taskId, fromColumn }: LifecycleDropVariables) => {
      await queryClient.cancelQueries({ queryKey: cancelKey });

      const previous = queryClient.getQueryData<TBoard>(dataKey);
      if (previous !== undefined) {
        queryClient.setQueryData<TBoard>(dataKey, update(previous, taskId, fromColumn));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<TBoard>(dataKey, context.previous);
      }
      toast.error('Yaşam döngüsü işlemi başarısız.');
    },
    onSettled: () => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === 'trash' ? 'Görev çöp kutusuna taşındı' : 'Görev arşivlendi',
      );
    },
  });
}
