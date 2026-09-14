'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type DayQuickCreateFormProps = {
  readonly dateKey: string;
  readonly onClose: () => void;
};

function dayLabel(dateKey: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${dateKey}T12:00:00`));
}

function DayQuickCreateForm({ dateKey, onClose }: DayQuickCreateFormProps) {
  const [title, setTitle] = useState('');
  const [plannedAt, setPlannedAt] = useState(`${dateKey}T09:00`);
  const [error, setError] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const create = useMutation({
    mutationFn: async () => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/tasks',
        body: {
          title: title.trim(),
          ...(plannedAt !== '' && { plannedAt }),
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Görev eklendi');
      queryClient.invalidateQueries({ queryKey: ['tasks', 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      onClose();
    },
    onError: (createError) => {
      setError(createError instanceof Error ? createError.message : 'Görev eklenemedi.');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    if (title.trim().length === 0) {
      setError('Görev başlığı girin.');
      return;
    }

    create.mutate();
  };

  return (
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Yeni görev</SheetTitle>
        <SheetDescription>{dayLabel(dateKey)}</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4">
        <Field>
          <FieldLabel htmlFor="day-quick-title">Başlık</FieldLabel>
          <Input
            id="day-quick-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn: Diş hekimi randevusu"
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="day-quick-planned-at">Başlangıç Tarihi</FieldLabel>
          <Input
            id="day-quick-planned-at"
            type="datetime-local"
            value={plannedAt}
            onChange={(event) => setPlannedAt(event.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(undefined);
              onClose();
            }}
          >
            İptal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}

type DayQuickCreateDialogProps = {
  readonly dateKey: string | null;
  readonly onClose: () => void;
};

export function DayQuickCreateDialog({ dateKey, onClose }: DayQuickCreateDialogProps) {
  return (
    <Sheet
      open={dateKey !== null}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      {dateKey !== null && <DayQuickCreateForm key={dateKey} dateKey={dateKey} onClose={onClose} />}
    </Sheet>
  );
}
