import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { cn } from '@/lib/utils';

import { LABEL_PALETTE, resolveLabelColor } from './label-color';
import type { CreateLabelFormValues } from './label-schema';

type LabelSummary = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly version: number;
};

type LabelManagerProps = {
  readonly selectedLabelIds: readonly string[];
  readonly onToggleLabel: (labelId: string) => void;
  readonly taskId?: string;
  readonly taskVersion?: number;
};

export function LabelManager({ selectedLabelIds, onToggleLabel }: LabelManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<string>(LABEL_PALETTE[0]);
  const queryClient = useQueryClient();

  const labels = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/labels',
      });

      if (result.error !== undefined) {
        throw new Error('Etiketler yüklenemedi.');
      }

      return (result.data as { data: LabelSummary[] }).data ?? [];
    },
  });

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const invalidateLabelConsumers = () => {
    queryClient.invalidateQueries({ queryKey: ['labels'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['areas'] });
    queryClient.invalidateQueries({ queryKey: ['search'] });
  };

  const createLabel = useMutation({
    mutationFn: async (values: CreateLabelFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/labels',
        body: values,
        headers: {
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return (result.data as { data: LabelSummary })?.data;
    },
    onSuccess: () => {
      invalidateLabelConsumers();
      setNewLabelName('');
      setIsCreating(false);
    },
  });

  const updateLabelColor = useMutation({
    mutationFn: async ({ label, color }: { label: LabelSummary; color: string }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: '/api/v1/labels/{labelId}',
        path: { labelId: label.id },
        body: { name: label.name, color },
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(label.version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      invalidateLabelConsumers();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  if (labels.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (labels.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{labels.error?.message ?? 'Etiketler yüklenemedi.'}</AlertDescription>
      </Alert>
    );
  }

  const labelList = labels.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Etiketler</h4>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'İptal' : '+ Yeni Etiket'}
        </Button>
      </div>

      {isCreating && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Etiket adı"
              className="h-8"
            />
            <Button
              type="button"
              size="sm"
              disabled={createLabel.isPending || newLabelName.trim().length === 0}
              onClick={() => createLabel.mutate({ name: newLabelName, color: newLabelColor })}
            >
              {createLabel.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Etiket rengi">
            {LABEL_PALETTE.map((tone) => {
              const isActive = newLabelColor.toLowerCase() === tone.toLowerCase();

              return (
                <button
                  key={tone}
                  type="button"
                  aria-label={`Renk ${tone}`}
                  aria-pressed={isActive}
                  onClick={() => setNewLabelColor(tone)}
                  className={cn(
                    'size-6 rounded-full border border-border/70 transition-transform active:scale-90',
                    isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                  )}
                  style={{ backgroundColor: tone }}
                />
              );
            })}
            <label
              className="relative flex size-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-border"
              title="Özel renk"
            >
              <span className="sr-only">Özel renk seç</span>
              <span
                aria-hidden="true"
                className="size-4 rounded-full"
                style={{ backgroundColor: newLabelColor }}
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                aria-label="Özel etiket rengi"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}

      {labelList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz etiket oluşturulmamış.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {labelList.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);

            return (
              <span
                key={label.id}
                className={cn(
                  'inline-flex items-center rounded-full border py-1 pr-1.5 pl-2 text-sm transition-colors duration-150',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-foreground hover:bg-muted',
                )}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleLabel(label.id)}
                  className="inline-flex items-center gap-1.5 rounded-full transition-transform duration-150 active:scale-95"
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: resolveLabelColor(label.color) }}
                  />
                  {label.name}
                </button>
                <label
                  title={`${label.name} rengini değiştir`}
                  className="relative ml-1.5 flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: resolveLabelColor(label.color) }}
                  />
                  <input
                    type="color"
                    value={resolveLabelColor(label.color)}
                    onChange={(e) => updateLabelColor.mutate({ label, color: e.target.value })}
                    aria-label={`${label.name} rengini değiştir`}
                    disabled={updateLabelColor.isPending}
                    className="absolute inset-0 cursor-pointer rounded-full opacity-0 disabled:cursor-not-allowed"
                  />
                </label>
              </span>
            );
          })}
        </div>
      )}

      {updateLabelColor.isError && (
        <p className="text-xs text-destructive">
          {updateLabelColor.error?.message ?? 'Renk güncellenemedi.'}
        </p>
      )}
    </div>
  );
}
