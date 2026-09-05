'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type TaskReminder = {
  readonly id: string;
  readonly taskId: string;
  readonly anchorType: 'PLANNED' | 'DUE';
  readonly ruleType: 'OFFSET' | 'AT_TIME';
  readonly offsetMinutes: number | null;
  readonly atTime: string | null;
  readonly scheduledAt: string;
  readonly state: string;
  readonly version: number;
};

type ReminderManagerProps = {
  readonly taskId: string;
  readonly plannedAt: string | null;
  readonly dueAt: string | null;
  readonly version: number;
};

const ANCHOR_LABELS: Record<string, string> = {
  PLANNED: 'Başlangıç',
  DUE: 'Bitiş',
};

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReminderManager({ taskId, plannedAt, dueAt, version }: ReminderManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [anchorType, setAnchorType] = useState<'PLANNED' | 'DUE'>(dueAt ? 'DUE' : 'PLANNED');
  const [offsetMinutes, setOffsetMinutes] = useState(30);
  const queryClient = useQueryClient();

  const reminders = useQuery({
    queryKey: ['tasks', taskId, 'reminders'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/tasks/{taskId}/reminders',
        path: { taskId },
      });

      if (result.error !== undefined) {
        throw new Error('Hatırlatmalar yüklenemedi.');
      }

      return (result.data as { data: readonly TaskReminder[] }).data ?? [];
    },
  });

  const createReminder = useMutation({
    mutationFn: async () => {
      const csrf = (await fetchCsrf()).token;
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/tasks/{taskId}/reminders',
        path: { taskId },
        body: {
          anchorType,
          ruleType: 'OFFSET',
          offsetMinutes,
        },
        headers: {
          'X-CSRF-Token': csrf,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'reminders'] });
      setShowForm(false);
    },
  });

  const cancelReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const csrf = (await fetchCsrf()).token;
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.delete({
        url: '/api/v1/tasks/{taskId}/reminders/{reminderId}',
        path: { taskId, reminderId },
        headers: {
          'X-CSRF-Token': csrf,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'reminders'] });
    },
  });

  const hasTime = plannedAt || dueAt;

  if (!hasTime) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Hatırlatmalar</div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="transition-transform duration-150 active:scale-[0.97]"
          >
            Ekle
          </Button>
        )}
      </div>

      {reminders.isLoading && (
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      )}

      {reminders.data && reminders.data.length > 0 && (
        <div className="mt-3 space-y-2">
          {reminders.data.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">{ANCHOR_LABELS[reminder.anchorType]}</span>
                <span className="text-muted-foreground"> — </span>
                <span>{reminder.offsetMinutes} dakika önce</span>
                <span className="text-muted-foreground">
                  {' '}
                  ({formatScheduledAt(reminder.scheduledAt)})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelReminder.mutate(reminder.id)}
                disabled={cancelReminder.isPending}
                className="h-6 px-2 text-xs transition-transform duration-150 active:scale-[0.97]"
              >
                Kaldır
              </Button>
            </div>
          ))}
        </div>
      )}

      {reminders.data && reminders.data.length === 0 && !showForm && (
        <div className="mt-2 text-sm text-muted-foreground">Hatırlatma yok</div>
      )}

      {showForm && (
        <div className="mt-3 space-y-3">
          {createReminder.isError && (
            <Alert variant="destructive">
              <AlertDescription>{createReminder.error.message}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel>Ana Hat</FieldLabel>
            <select
              value={anchorType}
              onChange={(e) => setAnchorType(e.target.value as 'PLANNED' | 'DUE')}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              {plannedAt && <option value="PLANNED">Başlangıç</option>}
              {dueAt && <option value="DUE">Bitiş</option>}
            </select>
          </Field>

          <Field>
            <FieldLabel>Dakika Önce</FieldLabel>
            <Input
              type="number"
              min={0}
              max={10080}
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(Number(e.target.value) || 0)}
              className="h-8"
            />
          </Field>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="transition-transform duration-150 active:scale-[0.97]"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => createReminder.mutate()}
              disabled={createReminder.isPending}
              className="transition-transform duration-150 active:scale-[0.97]"
            >
              {createReminder.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
