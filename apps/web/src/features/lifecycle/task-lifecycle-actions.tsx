'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { archiveResource, trashResource } from '@/features/lifecycle/lifecycle-api';

type TaskLifecycleActionsProps = {
  readonly taskId: string;
  readonly version: number;
  readonly lifecycleState: string;
};

export function TaskLifecycleActions({
  taskId,
  version,
  lifecycleState,
}: TaskLifecycleActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<null | 'ARCHIVE' | 'TRASH'>(null);

  const archiveAction = useMutation({
    mutationFn: async () => {
      await archiveResource({ resourceType: 'tasks', id: taskId, version }, queryClient);
    },
    onSuccess: () => {
      toast.success('Görev arşivlendi.');
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      router.push('/app/archive');
    },
  });

  const trashAction = useMutation({
    mutationFn: async () => {
      await trashResource({ resourceType: 'tasks', id: taskId, version }, queryClient);
    },
    onSuccess: () => {
      toast.success('Görev çöp kutusuna taşındı.');
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      router.push('/app/trash');
    },
  });

  if (lifecycleState !== 'ACTIVE') {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        Bu görev arşivde/çöp kutusunda. Yönetmek için{' '}
        <a
          href={lifecycleState === 'ARCHIVED' ? '/app/archive' : '/app/trash'}
          className="underline"
        >
          Arşiv
        </a>{' '}
        veya{' '}
        <a
          href={lifecycleState === 'ARCHIVED' ? '/app/trash' : '/app/archive'}
          className="underline"
        >
          Çöp Kutusu
        </a>{' '}
        sayfasını kullanın.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {confirming === 'ARCHIVE' ? (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(null)}
            className="h-7 transition-transform duration-150 active:scale-[0.97]"
          >
            Vazgeç
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={archiveAction.isPending}
            onClick={() => archiveAction.mutate()}
            className="h-7 transition-transform duration-150 active:scale-[0.97]"
          >
            {archiveAction.isPending ? 'Arşivleniyor...' : 'Arşivle'}
          </Button>
        </div>
      ) : confirming === 'TRASH' ? (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(null)}
            className="h-7 transition-transform duration-150 active:scale-[0.97]"
          >
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={trashAction.isPending}
            onClick={() => trashAction.mutate()}
            className="h-7 transition-transform duration-150 active:scale-[0.97]"
          >
            {trashAction.isPending ? 'Taşınıyor...' : 'Çöp Kutusuna Taşı'}
          </Button>
        </div>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming('ARCHIVE')}
            className="h-7 transition-transform duration-150 active:scale-[0.97]"
          >
            Arşivle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming('TRASH')}
            className="h-7 text-destructive transition-transform duration-150 active:scale-[0.97]"
          >
            Çöp Kutusu
          </Button>
        </>
      )}
    </div>
  );
}
