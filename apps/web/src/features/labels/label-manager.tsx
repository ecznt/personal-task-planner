import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { useState } from 'react';

import type { CreateLabelFormValues } from './label-schema';

type LabelSummary = {
  readonly id: string;
  readonly name: string;
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
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setNewLabelName('');
      setIsCreating(false);
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
            onClick={() => createLabel.mutate({ name: newLabelName })}
          >
            {createLabel.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </div>
      )}

      {labelList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz etiket oluşturulmamış.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {labelList.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => onToggleLabel(label.id)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors duration-150 active:scale-90 ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-foreground hover:bg-muted'
                }`}
              >
                {label.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
