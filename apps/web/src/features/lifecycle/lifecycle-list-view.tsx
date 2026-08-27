'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { apiError } from '@/features/auth/auth-api';
import { permanentDeleteResource, restoreResource, restoreFromTrashResource, type ResourceType } from '@/features/lifecycle/lifecycle-api';

type LifecycleEntry = {
  readonly id: string;
  readonly resourceType: ResourceType;
  readonly name: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly archivedAt: string | null;
  readonly trashedAt: string | null;
  readonly purgeAfter: string | null;
  readonly version: number;
};

type LifecycleListResponse = {
  readonly data: readonly LifecycleEntry[];
  readonly meta: { readonly nextCursor?: string };
};

export function LifecycleListView({ state, title, description }: { state: 'ARCHIVED' | 'TRASHED'; title: string; description: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<{ id: string; name: string; resourceType: ResourceType; version: number } | null>(null);

  const baseUrl = state === 'ARCHIVED' ? '/api/v1/archive' : '/api/v1/trash';

  const list = useQuery({
    queryKey: ['lifecycle', state.toLowerCase()],
    queryFn: async () => {
      const result = await apiClient.get({
        url: baseUrl,
        query: { limit: '50' },
      });
      if (result.error !== undefined) throw new Error('Kaynaklar yüklenemedi.');
      return result.data as LifecycleListResponse;
    },
  });

  const restoreOne = useMutation({
    mutationFn: async (entry: LifecycleEntry) => {
      if (state === 'ARCHIVED') {
        await restoreResource({ resourceType: entry.resourceType, id: entry.id, version: entry.version }, queryClient);
      } else {
        await restoreFromTrashResource({ resourceType: entry.resourceType, id: entry.id, version: entry.version }, queryClient);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle', state.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['areas'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
    },
  });

  const purgeOne = useMutation({
    mutationFn: async (entry: LifecycleEntry) => {
      await permanentDeleteResource({ resourceType: entry.resourceType, id: entry.id, version: entry.version }, queryClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle', 'trashed'] });
      setConfirming(null);
    },
  });

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (list.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{list.error?.message ?? 'Kaynaklar yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const entries = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-muted-foreground">Öğe yok</div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={`${entry.resourceType}-${entry.id}`} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{entry.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {resourceLabel(entry.resourceType)}
                    {entry.purgeAfter && <> · silinecek: {formatDate(entry.purgeAfter)}</>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {state === 'TRASHED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming({ id: entry.id, name: entry.name, resourceType: entry.resourceType, version: entry.version })}
                      className="h-7 px-2 text-xs text-destructive transition-transform duration-150 active:scale-[0.97]"
                    >
                      Kalıcı Sil
                    </Button>
                  )}
                  <Button
                    variant={state === 'TRASHED' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => restoreOne.mutate(entry)}
                    disabled={restoreOne.isPending}
                    className="h-7 transition-transform duration-150 active:scale-[0.97]"
                  >
                    Geri Yükle
                  </Button>
                </div>
              </div>

              {confirming?.id === entry.id && (
                <div className="mt-3 rounded-md bg-destructive/10 p-3">
                  <p className="text-sm">
                    <strong>{entry.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                  </p>
                  <div className="mt-2 flex gap-2">
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
                      onClick={() => purgeOne.mutate(entry)}
                      disabled={purgeOne.isPending}
                      className="h-7 transition-transform duration-150 active:scale-[0.97]"
                    >
                      {purgeOne.isPending ? 'Siliniyor...' : 'Kalıcı Sil'}
                    </Button>
                  </div>
                  {purgeOne.isError && (
                    <p className="mt-2 text-sm text-destructive">{apiError(purgeOne.error as never).message}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function resourceLabel(resourceType: ResourceType): string {
  if (resourceType === 'areas') return 'Alan';
  if (resourceType === 'projects') return 'Proje';
  return 'Görev';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
