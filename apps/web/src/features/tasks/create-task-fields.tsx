'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { LabelManager } from '@/features/labels/label-manager';
import { cn } from '@/lib/utils';

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

type AreaTaskOption = {
  readonly id: string;
  readonly title: string;
};

type CreateTaskFieldsProps = {
  readonly areaId: string;
  readonly initialProjectId?: string;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function DisclosureRow({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/60 active:bg-muted"
      >
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-muted-foreground">{value}</span>
          <ChevronRight
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200 [transition-timing-function:var(--ease-out)]',
              open && 'rotate-90',
            )}
          />
        </span>
      </button>
      <div data-open={open} className="accordion-content">
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-4 py-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PriorityControl({
  value,
  onChange,
}: {
  value: 'LOW' | 'MEDIUM' | 'HIGH';
  onChange: (value: 'LOW' | 'MEDIUM' | 'HIGH') => void;
}) {
  const options = [
    { value: 'LOW', label: 'Düşük' },
    { value: 'MEDIUM', label: 'Orta' },
    { value: 'HIGH', label: 'Yüksek' },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Öncelik"
      className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 active:scale-95',
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

let checklistKey = 0;

export function CreateTaskFields({
  areaId,
  initialProjectId,
  onSuccess,
  onCancel,
}: CreateTaskFieldsProps) {
  const [selectedLabelIds, setSelectedLabelIds] = useState<readonly string[]>([]);
  const [blockedByTaskIds, setBlockedByTaskIds] = useState<readonly string[]>([]);
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

  const areaTasks = useQuery({
    queryKey: ['areas', areaId, 'tasks'],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId },
      });
      if (result.error !== undefined) {
        return [];
      }
      return (result.data as { data: AreaTaskOption[] }).data ?? [];
    },
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
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: initialProjectId ?? '',
    },
    resolver: zodResolver(createTaskSchema),
  });

  const watchedPriority = useWatch({ control: form.control, name: 'priority' });

  const create = useMutation({
    mutationFn: async (values: CreateTaskFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const body: Record<string, unknown> = {
        title: values.title,
        description: values.description || null,
        plannedAt: values.plannedAt || null,
        dueAt: values.dueAt || null,
        durationMinutes: values.durationMinutes ?? null,
        priority: values.priority,
        projectId: values.projectId || null,
        labelIds: [...selectedLabelIds],
        blockedByTaskIds: blockedByTaskIds.length > 0 ? [...blockedByTaskIds] : undefined,
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
    setBlockedByTaskIds([]);
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
    <form onSubmit={form.handleSubmit((values) => create.mutate(values))} className="space-y-5">
      {create.isError && (
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{create.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <input
          id="title"
          placeholder="Görev başlığı"
          className="w-full rounded-sm border-none bg-transparent px-0 text-lg font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p role="alert" className="text-sm font-normal text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
        <textarea
          id="description"
          rows={2}
          placeholder="Açıklama ekle (isteğe bağlı)"
          className="w-full resize-none rounded-sm border-none bg-transparent px-0 text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring/30"
          {...form.register('description')}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>Planlama</SectionLabel>
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card shadow-surface">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">Başlangıç</span>
            <Input
              id="plannedAt"
              type="datetime-local"
              className="h-8 w-48 shrink-0 text-right"
              {...form.register('plannedAt')}
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">Bitiş</span>
            <Input
              id="dueAt"
              type="datetime-local"
              className="h-8 w-48 shrink-0 text-right"
              {...form.register('dueAt')}
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">Öncelik</span>
            <PriorityControl
              value={watchedPriority}
              onChange={(priority) => form.setValue('priority', priority)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">Süre</span>
            <div className="flex items-center gap-1.5">
              <Input
                id="durationMinutes"
                type="number"
                min="1"
                max="1440"
                step="5"
                placeholder="—"
                className="h-8 w-20 text-right"
                {...form.register('durationMinutes', {
                  setValueAs: (value) => {
                    const raw = String(value ?? '').trim();
                    if (raw === '') {
                      return null;
                    }
                    const parsed = Number(raw);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
                  },
                })}
              />
              <span className="text-sm text-muted-foreground">dk</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel>Düzenle</SectionLabel>
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card shadow-surface">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">Proje</span>
            <Select id="projectId" className="h-8 w-44 shrink-0" {...form.register('projectId')}>
              <option value="">Proje yok</option>
              {(projects.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          <DisclosureRow label="Etiketler" value={selectedLabelIds.length > 0 ? `${selectedLabelIds.length} seçili` : 'Yok'}>
            <LabelManager
              selectedLabelIds={selectedLabelIds}
              onToggleLabel={(id) => {
                setSelectedLabelIds((prev) =>
                  prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
                );
              }}
            />
          </DisclosureRow>

          <DisclosureRow
            label="Bağımlılıklar"
            value={blockedByTaskIds.length > 0 ? `${blockedByTaskIds.length} görev` : 'Yok'}
          >
            {areaTasks.isLoading ? (
              <p className="text-sm text-muted-foreground">Görevler yükleniyor...</p>
            ) : (areaTasks.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu alanda başka görev yok; bağımlılık eklemek için önce görev oluşturun.
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                {(areaTasks.data ?? []).map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-primary"
                      checked={blockedByTaskIds.includes(task.id)}
                      onChange={() => {
                        setBlockedByTaskIds((prev) =>
                          prev.includes(task.id)
                            ? prev.filter((id) => id !== task.id)
                            : [...prev, task.id],
                        );
                      }}
                    />
                    <span className="min-w-0 break-words">{task.title}</span>
                  </label>
                ))}
              </div>
            )}
          </DisclosureRow>

          <DisclosureRow
            label="Kontrol listesi"
            value={checklistItems.length > 0 ? `${checklistItems.length} madde` : 'Yok'}
          >
            <div className="space-y-2">
              {checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Görev için kontrol listesi eklemek üzere madde oluşturabilirsiniz.
                </p>
              ) : (
                <div className="space-y-2">
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
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
          </DisclosureRow>

          <DisclosureRow
            label="Tekrarlama"
            value={recurrence ? describeRecurrence(recurrence) : 'Yok'}
          >
            <div className="space-y-3">
              {recurrence && (
                <p className="text-sm text-muted-foreground">{describeRecurrence(recurrence)}</p>
              )}
              {!recurrence && showRecurrence && (
                <RecurrenceForm
                  onSubmit={handleRecurrenceSubmit}
                  onCancel={() => setShowRecurrence(false)}
                  isPending={false}
                  error={recurrenceError}
                />
              )}
              {recurrence ? (
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveRecurrence}>
                  Tekrarlamayı kaldır
                </Button>
              ) : (
                !showRecurrence && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecurrence(true)}
                  >
                    + Tekrarlama Ayarla
                  </Button>
                )
              )}
            </div>
          </DisclosureRow>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onCancel();
            }}
          >
            İptal
          </Button>
        )}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Oluşturuluyor...' : 'Görevi Oluştur'}
        </Button>
      </div>
    </form>
  );
}