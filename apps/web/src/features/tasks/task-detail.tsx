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
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { Checklist } from '@/features/checklist/checklist';
import { LabelManager } from '@/features/labels/label-manager';
import { ReminderManager } from '@/features/reminders/reminder-manager';

import { editTaskSchema, type EditTaskFormValues } from './task-schema';

type LabelSummary = {
  readonly id: string;
  readonly name: string;
};

type ChecklistItem = {
  readonly id: string;
  readonly text: string;
  readonly position: number;
  readonly completed: boolean;
};

type RecurrenceInfo = {
  readonly series: {
    readonly id: string;
    readonly state: string;
    readonly currentOpenTaskId: string | null;
    readonly nextOccurrenceNumber: number;
  };
  readonly activeRule: {
    readonly id: string;
    readonly mode: string;
    readonly frequency: string;
    readonly interval: number;
    readonly selectedWeekdays: readonly number[];
    readonly dayOfMonth: number | null;
    readonly monthOfYear: number | null;
    readonly localTime: string | null;
  };
  readonly currentOpenTaskId: string | null;
} | null;

type TaskData = {
  readonly id: string;
  readonly areaId: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: string | null;
  readonly dueAt: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly areaStatusId: string;
  readonly canonicalStatus: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly labels: readonly LabelSummary[];
  readonly checklistItems: readonly ChecklistItem[];
  readonly projectId: string | null;
  readonly recurrence: RecurrenceInfo;
};

type TaskDetailProps = {
  readonly taskId: string;
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<readonly string[]>([]);
  const queryClient = useQueryClient();

  const task = useQuery({
    queryKey: ['areas', 'tasks', taskId],
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/tasks/{taskId}',
        path: { taskId },
      });

      if (result.error !== undefined) {
        throw new Error('Görev yüklenemedi.');
      }

      const data = (result.data as { data: TaskData }).data;
      setSelectedLabelIds(data.labels.map((l) => l.id));
      return result.data as { data: TaskData };
    },
  });

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const taskDataForQuery = task.data?.data;
  const areaId = taskDataForQuery?.areaId;

  const projects = useQuery({
    queryKey: ['projects', areaId],
    queryFn: async () => {
      if (!areaId) return [];
      const result = await apiClient.get({
        url: '/api/v1/projects',
        query: { areaId },
      });

      if (result.error !== undefined) {
        return [];
      }

      return (result.data as { data: readonly { id: string; name: string }[] }).data ?? [];
    },
    enabled: !!areaId,
  });

  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
  });

  const edit = useMutation({
    mutationFn: async (values: EditTaskFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const current = task.data?.data;
      if (!current) throw new Error('Görev bulunamadı.');

      const body: Record<string, unknown> = {};
      if (values.title !== undefined && values.title !== current.title) body.title = values.title;
      if (values.description !== undefined) body.description = values.description || null;
      if (values.plannedAt !== undefined) body.plannedAt = values.plannedAt || null;
      if (values.dueAt !== undefined) body.dueAt = values.dueAt || null;
      if (values.priority !== undefined) body.priority = values.priority;
      body.labelIds = [...selectedLabelIds];
      if (values.projectId !== undefined) {
        body.projectId = values.projectId || null;
      }

      if (Object.keys(body).length === 0) {
        setIsEditing(false);
        return current;
      }

      const result = await apiClient.patch({
        url: '/api/v1/tasks/{taskId}',
        path: { taskId },
        body,
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(current.version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return (result.data as { data: TaskData })?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', 'tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['areas', task.data?.data.areaId, 'tasks'] });
      setIsEditing(false);
    },
  });

  if (task.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (task.isError || task.data === undefined) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{task.error?.message ?? 'Görev bulunamadı.'}</AlertDescription>
      </Alert>
    );
  }

  const taskData = task.data.data;

  if (isEditing) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-medium">Görevi Düzenle</h3>
        <form
          onSubmit={form.handleSubmit((values) => edit.mutate(values))}
          className="mt-3 space-y-4"
        >
          {edit.isError && (
            <Alert variant="destructive">
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{edit.error.message}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="title">Başlık</FieldLabel>
            <Input id="title" defaultValue={taskData.title} {...form.register('title')} />
            {form.formState.errors.title && (
              <FieldError>{form.formState.errors.title.message}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Açıklama</FieldLabel>
            <textarea
              id="description"
              rows={3}
              defaultValue={taskData.description ?? ''}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <FieldError>{form.formState.errors.description.message}</FieldError>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="plannedAt">Başlangıç Tarihi</FieldLabel>
              <Input
                id="plannedAt"
                type="datetime-local"
                defaultValue={toLocalDatetime(taskData.plannedAt)}
                {...form.register('plannedAt')}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dueAt">Bitiş Tarihi</FieldLabel>
              <Input
                id="dueAt"
                type="datetime-local"
                defaultValue={toLocalDatetime(taskData.dueAt)}
                {...form.register('dueAt')}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="priority">Öncelik</FieldLabel>
            <select
              id="priority"
              defaultValue={taskData.priority}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              {...form.register('priority')}
            >
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
            </select>
          </Field>
          <LabelManager
            selectedLabelIds={selectedLabelIds}
            onToggleLabel={(id) => {
              setSelectedLabelIds((prev) =>
                prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
              );
            }}
          />
          <Field>
            <FieldLabel htmlFor="projectId">Proje</FieldLabel>
            <select
              id="projectId"
              defaultValue={taskData.projectId ?? ''}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              {...form.register('projectId')}
            >
              <option value="">Proje yok</option>
              {(projects.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                form.reset();
              }}
            >
              İptal
            </Button>
            <Button type="submit" disabled={edit.isPending}>
              {edit.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a
            href={`/app/areas/${taskData.areaId}`}
            className="text-sm text-muted-foreground transition-colors duration-150 hover:underline"
          >
            ← Alana dön
          </a>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{taskData.title}</h1>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(true)} className="transition-transform duration-150 active:scale-[0.97]">
          Düzenle
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Durum</div>
          <div className="mt-1 font-medium">{taskData.canonicalStatus}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Öncelik</div>
          <div className="mt-1 font-medium">{PRIORITY_LABELS[taskData.priority]}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Proje</div>
          <div className="mt-1 font-medium">
            {taskData.projectId
              ? ((projects.data ?? []).find((p) => p.id === taskData.projectId)?.name ?? '-')
              : '-'}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Başlangıç</div>
          <div className="mt-1 font-medium">{formatDate(taskData.plannedAt)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Bitiş</div>
          <div className="mt-1 font-medium">{formatDate(taskData.dueAt)}</div>
        </div>
      </div>

      {taskData.description && (
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Açıklama</div>
          <div className="mt-1 whitespace-pre-wrap text-sm">{taskData.description}</div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <LabelManager
          selectedLabelIds={selectedLabelIds}
          onToggleLabel={(id) => {
            setSelectedLabelIds((prev) =>
              prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
            );
          }}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Checklist taskId={taskId} />
      </div>

      <ReminderManager
        taskId={taskId}
        plannedAt={taskData.plannedAt}
        dueAt={taskData.dueAt}
        version={taskData.version}
      />

      <RecurrenceSection taskId={taskId} taskData={taskData} queryClient={queryClient} csrfToken={csrfQuery.data?.token} />
    </div>
  );
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Her gün',
  WEEKDAYS: 'Her iş günü',
  WEEKLY: 'Her hafta',
  MONTHLY: 'Her ay',
  YEARLY: 'Her yıl',
};

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

function describeRecurrence(rule: RecurrenceInfo extends null ? never : NonNullable<RecurrenceInfo>['activeRule']): string {
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

function RecurrenceSection({
  taskId,
  taskData,
  queryClient,
  csrfToken,
}: {
  readonly taskId: string;
  readonly taskData: TaskData;
  readonly queryClient: ReturnType<typeof useQueryClient>;
  readonly csrfToken: string | undefined;
}) {
  const [showForm, setShowForm] = useState(false);
  const recurrence = taskData.recurrence;

  const setRecurrence = useMutation({
    mutationFn: async (values: {
      mode: string;
      frequency: string;
      interval: number;
      selectedWeekdays: number[];
      dayOfMonth: number | null;
      monthOfYear: number | null;
    }) => {
      const csrf = csrfToken ?? (await fetchCsrf()).token;

      const result = await apiClient.put({
        url: '/api/v1/tasks/{taskId}/recurrence',
        path: { taskId },
        body: values,
        headers: {
          'X-CSRF-Token': csrf,
          'If-Match': String(taskData.version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', 'tasks', taskId] });
      setShowForm(false);
    },
  });

  const stopRecurrence = useMutation({
    mutationFn: async () => {
      const csrf = csrfToken ?? (await fetchCsrf()).token;

      const result = await apiClient.delete({
        url: '/api/v1/tasks/{taskId}/recurrence',
        path: { taskId },
        headers: {
          'X-CSRF-Token': csrf,
          'If-Match': String(taskData.version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', 'tasks', taskId] });
    },
  });

  if (recurrence && !showForm) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Tekrarlama</div>
            <div className="mt-1 font-medium">
              {describeRecurrence(recurrence.activeRule)}
            </div>
            {recurrence.series.state !== 'ACTIVE' && (
              <div className="mt-1 text-xs text-muted-foreground">
                Duraklatılmış
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {recurrence.series.state === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => stopRecurrence.mutate()}
                disabled={stopRecurrence.isPending}
                className="transition-transform duration-150 active:scale-[0.97]"
              >
                {stopRecurrence.isPending ? 'Durduruluyor...' : 'Durdur'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium">Tekrarlama Ayarla</h3>
        <RecurrenceForm
          onSubmit={(values) => setRecurrence.mutate(values)}
          onCancel={() => setShowForm(false)}
          isPending={setRecurrence.isPending}
          error={setRecurrence.error?.message}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">Tekrarlama</div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 transition-transform duration-150 active:scale-[0.97]"
        onClick={() => setShowForm(true)}
      >
        Tekrarlama Ayarla
      </Button>
    </div>
  );
}

function RecurrenceForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: {
  readonly onSubmit: (values: {
    mode: string;
    frequency: string;
    interval: number;
    selectedWeekdays: number[];
    dayOfMonth: number | null;
    monthOfYear: number | null;
  }) => void;
  readonly onCancel: () => void;
  readonly isPending: boolean;
  readonly error: string | undefined;
}) {
  const [frequency, setFrequency] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [monthOfYear, setMonthOfYear] = useState<number | null>(null);

  const handleSubmit = () => {
    onSubmit({
      mode: 'CALENDAR_BASED',
      frequency,
      interval,
      selectedWeekdays,
      dayOfMonth,
      monthOfYear,
    });
  };

  return (
    <div className="mt-3 space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Field>
        <FieldLabel>Sıklık</FieldLabel>
        <select
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value);
            setSelectedWeekdays([]);
            setDayOfMonth(null);
            setMonthOfYear(null);
          }}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          <option value="DAILY">Her gün</option>
          <option value="WEEKDAYS">Her iş günü</option>
          <option value="WEEKLY">Her hafta</option>
          <option value="MONTHLY">Her ay</option>
          <option value="YEARLY">Her yıl</option>
        </select>
      </Field>

      {frequency !== 'WEEKDAYS' && (
        <Field>
          <FieldLabel>Her ... bir</FieldLabel>
          <Input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value) || 1)}
            className="h-8"
          />
        </Field>
      )}

      {frequency === 'WEEKLY' && (
        <Field>
          <FieldLabel>Günler</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedWeekdays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
                  );
                }}
                className={`rounded-lg border px-3 py-1 text-sm transition-all duration-150 ${
                  selectedWeekdays.includes(day)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent hover:bg-muted'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </Field>
      )}

      {frequency === 'MONTHLY' && (
        <Field>
          <FieldLabel>Ayın günü</FieldLabel>
          <Input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth ?? ''}
            onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)}
            placeholder="1-31"
            className="h-8"
          />
        </Field>
      )}

      {frequency === 'YEARLY' && (
        <>
          <Field>
            <FieldLabel>Ay</FieldLabel>
            <Input
              type="number"
              min={1}
              max={12}
              value={monthOfYear ?? ''}
              onChange={(e) => setMonthOfYear(e.target.value ? Number(e.target.value) : null)}
              placeholder="1-12"
              className="h-8"
            />
          </Field>
          <Field>
            <FieldLabel>Gün</FieldLabel>
            <Input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth ?? ''}
              onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)}
              placeholder="1-31"
              className="h-8"
            />
          </Field>
        </>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          İptal
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || (frequency === 'WEEKLY' && selectedWeekdays.length === 0)}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          {isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
