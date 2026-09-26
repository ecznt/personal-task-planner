'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Spinner } from '@/components/ui/spinner';
import { AuthApiError, apiError } from '@/features/auth/auth-api';
import {
  permanentDeleteResource,
  restoreResource,
  restoreFromTrashResource,
  type ResourceType,
} from '@/features/lifecycle/lifecycle-api';

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

export function LifecycleListView({
  state,
  title,
  description,
}: {
  state: 'ARCHIVED' | 'TRASHED';
  title: string;
  description: string;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<{
    id: string;
    name: string;
    resourceType: ResourceType;
    version: number;
  } | null>(null);
  const [restoreFailure, setRestoreFailure] = useState<{
    entry: LifecycleEntry;
    message: string;
    code?: string;
  } | null>(null);

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
    mutationFn: async ({
      entry,
      replacementAreaId,
    }: {
      entry: LifecycleEntry;
      replacementAreaId?: string;
    }) => {
      const options = {
        resourceType: entry.resourceType,
        id: entry.id,
        version: entry.version,
        ...(replacementAreaId !== undefined && { replacementAreaId }),
      };
      if (state === 'ARCHIVED') {
        await restoreResource(options, queryClient);
      } else {
        await restoreFromTrashResource(options, queryClient);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle', state.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['areas'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      setRestoreFailure(null);
    },
    onError: (error, variables) => {
      setRestoreFailure({
        entry: variables.entry,
        message: error.message,
        ...(error instanceof AuthApiError && error.code !== undefined
          ? { code: error.code }
          : {}),
      });
    },
  });

  const purgeOne = useMutation({
    mutationFn: async (entry: LifecycleEntry) => {
      await permanentDeleteResource(
        { resourceType: entry.resourceType, id: entry.id, version: entry.version },
        queryClient,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle', 'trashed'] });
      setConfirming(null);
    },
  });

  const areas = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await apiClient.get({ url: '/api/v1/areas' });
      if (result.error !== undefined) return [];
      return (result.data as { data: readonly { id: string; name: string }[] }).data ?? [];
    },
  });

  const needsDestination =
    restoreFailure !== null && restoreFailure.code === 'DESTINATION_UNAVAILABLE';

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
      <PageHeader title={title} description={description} />

      {entries.length === 0 ? (
<EmptyState
          icon={<Archive className="size-5" aria-hidden="true" />}
          title="Burada henüz bir şey yok"
          description="Taşıdığın görevler listeye düşer. Şimdilik bomboş — dilediğin gibi doldurabilirsin."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={`${entry.resourceType}-${entry.id}`}
              className="rounded-lg border bg-card p-4"
            >
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
                      onClick={() =>
                        setConfirming({
                          id: entry.id,
                          name: entry.name,
                          resourceType: entry.resourceType,
                          version: entry.version,
                        })
                      }
                      className="h-7 px-2 text-xs text-destructive transition-transform duration-150 active:scale-[0.97]"
                    >
                      Kalıcı Sil
                    </Button>
                  )}
                  <Button
                    variant={state === 'TRASHED' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => restoreOne.mutate({ entry })}
                    disabled={restoreOne.isPending}
                    className="h-7 transition-transform duration-150 active:scale-[0.97]"
                  >
                    Geri Yükle
                  </Button>
                </div>
              </div>

              {restoreFailure?.entry.id === entry.id && (
                <div className="mt-3 rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{restoreFailure.message}</p>
                  {needsDestination && entry.resourceType !== 'areas' && (
                    <RestoreDestinationPicker
                      options={areas.data ?? []}
                      onRestore={(replacementAreaId) =>
                        restoreOne.mutate({ entry, replacementAreaId })
                      }
                      isPending={restoreOne.isPending}
                    />
                  )}
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRestoreFailure(null)}
                      className="h-7 transition-transform duration-150 active:scale-[0.97]"
                    >
                      Kapat
                    </Button>
                  </div>
                </div>
              )}

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
                    <p className="mt-2 text-sm text-destructive">
                      {apiError(purgeOne.error as never).message}
                    </p>
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

function RestoreDestinationPicker({
  options,
  onRestore,
  isPending,
}: {
  readonly options: readonly { readonly id: string; readonly name: string }[];
  readonly onRestore: (areaId: string) => void;
  readonly isPending: boolean;
}) {
  const [areaId, setAreaId] = useState<string>('');
  const active = options.filter((area) => area.id !== '');

  return (
    <div className="mt-2 space-y-2">
      <label className="block text-xs text-muted-foreground" htmlFor="restore-destination">
        Üst alan arşivde/çöpte. Görevi başka bir alana geri yükle:
      </label>
      <select
        id="restore-destination"
        value={areaId}
        onChange={(event) => setAreaId(event.target.value)}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Alan seç…
        </option>
        {active.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        size="sm"
        disabled={isPending || areaId.length === 0}
        onClick={() => onRestore(areaId)}
        className="h-7 transition-transform duration-150 active:scale-[0.97]"
      >
        {isPending ? 'Geri yükleniyor...' : 'Bu alana geri yükle'}
      </Button>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
