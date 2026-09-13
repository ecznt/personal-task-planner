'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { LabelManager } from '@/features/labels/label-manager';

import { RecurrenceForm, WEEKDAY_LABELS, type RecurrenceFormValues } from './recurrence-form';
import {
  createTaskSchema,
  type CreateTaskFormValues,
  type CreateTaskRecurrenceValues,
} from './task-schema';

type CreateTaskData = {
  readonly id: string;
  readonly title: string;
};

type ProjectSummary = {
  readonly id: string;
  readonly name: string;
};

type ChecklistDraft = {
  readonly key: number;
  text: string;
};

type CreateTaskFieldsProps = {
  readonly areaId: string;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Her gün',
  WEEKDAYS: 'Her iş günü',
  WEEKLY: 'Her hafta',
  MONTHLY: 'Her ay',
  YEARLY: 'Her yıl',
};

function describeRecurrence(rule: CreateTaskRecurrenceValues): string {
  const freq = FREQUENCY_LABELS[rule.frequency] ?? rule.frequency;
  const interval = rule.interval > 1 ? ` ${rule.interval}` : '';

  if (rule.frequency === 'WEEKLY' && rule.selectedWeekdays.length > 0) {
    const days = rule.selectedWeekdays.map((d) => WEEKDAY_LABELS[d] ?? String(d)).join(', ');
    return `Her${interval} hafta ${days}`;
  }

  if (rule.frequency === 'MONTHLY' && rule.dayOfMonth !== null) {
    return `Her${interval} ayın ${rule.dayOfMonth}`;
  }

  if (rule.frequency === 'YEARLY' && rule.monthOfYear !== null && rule.dayOfMonth !== null) {
    return `Her${interval} yıl ${rule.monthOfYear}/${rule.dayOfMonth}`;
  }

  return `${freq}${interval ? ` ${rule.interval} günlük` : ''}`;
}

let checklistKey = 0;

export function CreateTaskFields({ areaId, onSuccess, onCancel }: CreateTaskFieldsProps) {
  const [selectedLabelIds, setSelectedLabelIds] = useState<readonly string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistDraft[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceFormValues | null>(null);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrenceError, setRecurrenceError] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const projects = useQuery({
    queryKey: ['projects', areaId],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { areaId },
      });

      if (result.error !== undefined) {
        return [];
      }

      return (result.data as { data: ProjectSummary[] }).data ?? [];
    },
  });

  const form = useForm<CreateTaskFormValues>({
    defaultValues: { title: '', description: '', priority: 'MEDIUM', projectId: '' },
    resolver: zodResolver(createTaskSchema),
  });

  const create = useMutation({
    mutationFn: async (values: CreateTaskFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const body: Record<string, unknown> = {
        title: values.title,
        description: values.description || null,
        plannedAt: values.plannedAt || null,
        dueAt: values.dueAt || null,
        priority: values.priority,
        projectId: values.projectId || null,
        labelIds: [...selectedLabelIds],
        checklistItems: checklistItems
          .map((item) => ({ text: item.text }))
          .filter((item) => item.text.trim().length > 0),
        recurrence,
      };

      const result = await apiClient.post({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId },
        body,
        headers: {
          'X-CSRF-Token': csrf.token,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const data = result.data as { data: CreateTaskData } | undefined;

      if (data?.data === undefined) {
        throw new Error('Görev oluşturulamadı.');
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', areaId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['areas', areaId] });
      resetForm();
      onSuccess?.();
    },
  });

  function resetForm() {
    form.reset();
    setSelectedLabelIds([]);
    setChecklistItems([]);
    setRecurrence(null);
    setShowRecurrence(false);
    setRecurrenceError(undefined);
  }

  const addChecklistItem = () => {
    setChecklistItems((prev) => [...prev, { key: ++checklistKey, text: '' }]);
  };

  const removeChecklistItem = (key: number) => {
    setChecklistItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateChecklistItem = (key: number, text: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.key === key ? { ...item, text } : item)));
  };

  const handleRecurrenceSubmit = (values: RecurrenceFormValues) => {
    const anchor = form.getValues('plannedAt') || form.getValues('dueAt');
    if (!anchor) {
      setRecurrenceError('Tekrarlayan görev için planlama veya bitiş tarihi gereklidir.');
      return;
    }
    setRecurrenceError(undefined);
    setRecurrence(values);
    setShowRecurrence(false);
  };

  const handleRemoveRecurrence = () => {
    setRecurrence(null);
    setRecurrenceError(undefined);
  };

  return (
    <form onSubmit={form.handleSubmit((values) => create.mutate(values))} className="space-y-4">
      {create.isError && (
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{create.error.message}</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="title">Başlık</FieldLabel>
        <Input id="title" placeholder="Örn: Marketten süt al" {...form.register('title')} />
        {form.formState.errors.title && (
          <FieldError>{form.formState.errors.title.message}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Açıklama (isteğe bağlı)</FieldLabel>
        <textarea
          id="description"
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          placeholder="Görev detayları..."
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <FieldError>{form.formState.errors.description.message}</FieldError>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="plannedAt">Başlangıç Tarihi</FieldLabel>
          <Input id="plannedAt" type="datetime-local" {...form.register('plannedAt')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="dueAt">Bitiş Tarihi</FieldLabel>
          <Input id="dueAt" type="datetime-local" {...form.register('dueAt')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="priority">Öncelik</FieldLabel>
          <Select id="priority" {...form.register('priority')}>
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="projectId">Proje</FieldLabel>
          <Select id="projectId" {...form.register('projectId')}>
            <option value="">Proje yok</option>
            {(projects.data ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <LabelManager
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={(id) => {
          setSelectedLabelIds((prev) =>
            prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
          );
        }}
      />

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Kontrol Listesi</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addChecklistItem}
            disabled={checklistItems.length >= 100}
          >
            + Madde Ekle
          </Button>
        </div>
        {checklistItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Görev için kontrol listesi eklemek üzere madde oluşturabilirsiniz.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {checklistItems.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <Input
                  value={item.text}
                  onChange={(e) => updateChecklistItem(item.key, e.target.value)}
                  placeholder="Madde başlığı"
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-muted-foreground transition-colors duration-150 hover:text-destructive"
                  onClick={() => removeChecklistItem(item.key)}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Tekrarlama</h4>
          {recurrence ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleRemoveRecurrence}>
                Kaldır
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRecurrence(!showRecurrence)}
            >
              {showRecurrence ? 'İptal' : '+ Tekrarlama Ayarla'}
            </Button>
          )}
        </div>
        {recurrence && (
          <p className="mt-2 text-sm text-muted-foreground">{describeRecurrence(recurrence)}</p>
        )}
        {!recurrence && showRecurrence && (
          <div className="mt-3">
            <RecurrenceForm
              onSubmit={handleRecurrenceSubmit}
              onCancel={() => setShowRecurrence(false)}
              isPending={false}
              error={recurrenceError}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onCancel();
            }}
          >
            İptal
          </Button>
        )}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
        </Button>
      </div>
    </form>
  );
}
