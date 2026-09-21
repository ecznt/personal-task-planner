'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTree } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';
import { Checklist } from '@/features/checklist/checklist';
import { LabelManager } from '@/features/labels/label-manager';
import { TaskLifecycleActions } from '@/features/lifecycle/task-lifecycle-actions';
import { ReminderManager } from '@/features/reminders/reminder-manager';

import { AutosaveStatus, InlineDateTime, InlineSelect, InlineText } from './inline-field';
import { TaskDescription } from './task-description';
import { RecurrenceForm, WEEKDAY_LABELS } from './recurrence-form';
import { PRIORITY_LABELS } from './task-badge';
import {
  invalidateTaskCaches,
  readTaskFromCache,
  taskDetailQueryKey,
  useTaskPatch,
  type RecurrenceInfo,
  type TaskData,
  type TaskSubtask,
} from './task-patch';
import { useTaskInspector } from './task-inspector-context';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
];

const PRIORITY_TRIGGER_CLASS: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: 'border-transparent bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  MEDIUM: 'border-border/70 bg-muted/60',
  HIGH: 'border-transparent bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

function statusLabel(status: string): string {
  if (status === 'TO_DO') return 'Yapılacak';
  if (status === 'IN_PROGRESS') return 'Devam Ediyor';
  if (status === 'COMPLETED') return 'Tamamlandı';
  return status;
}

type TaskInspectorProps = {
  readonly taskId: string;
  readonly variant?: 'page' | 'sheet';
};

export function TaskInspector({ taskId, variant = 'page' }: TaskInspectorProps) {
  const queryClient = useQueryClient();
  const { openTask, closeTask } = useTaskInspector();
  const { saveFields, status, error, clearError } = useTaskPatch({ taskId });

  const task = useQuery({
    queryKey: taskDetailQueryKey(taskId),
    queryFn: async () => {
      const result = await apiClient.get({
        url: '/api/v1/tasks/{taskId}',
        path: { taskId },
      });

      if (result.error !== undefined) {
        throw new Error('Görev yüklenemedi.');
      }

      return result.data as { data: TaskData };
    },
  });

  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });

  const taskData = task.data?.data;
  const areaId = taskData?.areaId;

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

  const toggleLabel = useMutation({
    mutationFn: async (labelId: string) => {
      const current = readTaskFromCache(queryClient, taskId);
      if (current === undefined) throw new Error('Görev bulunamadı.');

      const hasLabel = current.labels.some((label) => label.id === labelId);
      const next = hasLabel
        ? current.labels.filter((label) => label.id !== labelId).map((label) => label.id)
        : [...current.labels.map((label) => label.id), labelId];

      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.patch({
        url: '/api/v1/tasks/{taskId}',
        path: { taskId },
        body: { labelIds: next },
        headers: {
          'X-CSRF-Token': csrf.token,
          'If-Match': String(current.version),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      const current = readTaskFromCache(queryClient, taskId);
      if (current !== undefined) {
        invalidateTaskCaches(queryClient, current);
      }
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

  const current = task.data.data;
  const selectedLabelIds = current.labels.map((label) => label.id);
  const parentTask = current.parentTask;

  const sections = (
    <>
      <div className="flex items-center justify-between gap-3">
        <a
          href={`/app/areas/${current.areaId}`}
          className="text-sm text-muted-foreground transition-colors duration-150 hover:underline"
          onClick={(event) => {
            if (variant === 'sheet') {
              event.preventDefault();
              closeTask();
            }
          }}
        >
          ← Alana dön
        </a>
        <AutosaveStatus status={status} />
      </div>

      {parentTask !== null && (
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Üst görev</div>
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 text-left font-medium transition-colors duration-150 hover:text-foreground"
            onClick={() => openTask(parentTask.id)}
          >
            <ListTree className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{parentTask.title}</span>
            <Badge variant="neutral">{statusLabel(parentTask.canonicalStatus)}</Badge>
          </button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Kaydedilemedi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearError}
            className="mt-2 transition-transform duration-150 active:scale-[0.97]"
          >
            Tamam
          </Button>
        </Alert>
      )}

      <InlineText
        value={current.title}
        placeholder="Görev başlığı"
        onCommit={(next) => {
          saveFields({ title: next });
        }}
        className="text-2xl leading-snug font-bold tracking-tight"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{statusLabel(current.canonicalStatus)}</Badge>
        <span className="text-xs text-muted-foreground">
          Öncelik {PRIORITY_LABELS[current.priority]}
        </span>
      </div>

      <div className="card-surface rounded-xl border border-border/70 bg-card p-4 shadow-surface">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <InlineSelect
            label="Öncelik"
            value={current.priority}
            options={PRIORITY_OPTIONS}
            triggerClassName={PRIORITY_TRIGGER_CLASS[current.priority]}
            onCommit={(next) => {
              saveFields({ priority: next });
            }}
          />
          <InlineSelect
            label="Proje"
            value={current.projectId}
            placeholder="Proje yok"
            options={(projects.data ?? []).map((project) => ({
              value: project.id,
              label: project.name,
            }))}
            onCommit={(next) => {
              saveFields({ projectId: next || null });
            }}
            onClear={() => {
              saveFields({ projectId: null });
            }}
          />
          <InlineDateTime
            label="Başlangıç"
            value={current.plannedAt}
            placeholder="Başlangıç ekle"
            onCommit={(iso) => {
              saveFields({ plannedAt: iso });
            }}
          />
          <InlineDateTime
            label="Bitiş"
            value={current.dueAt}
            placeholder="Bitiş ekle"
            onCommit={(iso) => {
              saveFields({ dueAt: iso });
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <TaskDescription
          value={current.description ?? ''}
          placeholder="Açıklama ekle…"
          onCommit={(next) => {
            saveFields({ description: next.length > 0 ? next : null });
          }}
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <TaskLifecycleActions
          taskId={taskId}
          version={current.version}
          lifecycleState={current.lifecycleState}
          {...(variant === 'sheet' ? { onNavigateAway: closeTask } : {})}
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <LabelManager
          selectedLabelIds={selectedLabelIds}
          onToggleLabel={(labelId) => {
            toggleLabel.mutate(labelId);
          }}
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Checklist taskId={taskId} />
      </div>

      {current.parentTaskId === null && (
        <SubtasksSection
          taskId={taskId}
          areaId={current.areaId}
          subtaskCount={current.subtaskCount}
          completedSubtaskCount={current.completedSubtaskCount}
          subtasks={current.subtasks}
          onOpenSubtask={openTask}
          csrfToken={csrfQuery.data?.token}
        />
      )}

      <ReminderManager
        taskId={taskId}
        plannedAt={current.plannedAt}
        dueAt={current.dueAt}
        version={current.version}
      />

      <RecurrenceSection taskId={taskId} taskData={current} csrfToken={csrfQuery.data?.token} />
    </>
  );

  if (variant === 'sheet') {
    return (
      <div className="h-full overflow-y-auto px-5 pb-10 pt-5">
        <div className="space-y-5">{sections}</div>
      </div>
    );
  }

  return <div className="space-y-6">{sections}</div>;
}

function SubtasksSection({
  taskId,
  areaId,
  subtaskCount,
  completedSubtaskCount,
  subtasks,
  onOpenSubtask,
  csrfToken,
}: {
  readonly taskId: string;
  readonly areaId: string;
  readonly subtaskCount: number;
  readonly completedSubtaskCount: number;
  readonly subtasks: readonly TaskSubtask[];
  readonly onOpenSubtask: (subtaskId: string) => void;
  readonly csrfToken: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');

  const createSubtask = useMutation({
    mutationFn: async (value: string) => {
      const csrf = csrfToken ?? (await fetchCsrf()).token;

      const result = await apiClient.post({
        url: '/api/v1/areas/{areaId}/tasks',
        path: { areaId },
        body: { title: value, parentTaskId: taskId },
        headers: {
          'X-CSRF-Token': csrf,
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      invalidateTaskCaches(queryClient, { areaId });
      setTitle('');
      setShowForm(false);
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">Alt Görevler</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="transition-transform duration-150 active:scale-[0.97]"
          onClick={() => {
            setShowForm((open) => !open);
            setTitle('');
          }}
        >
          {showForm ? 'İptal' : '+ Alt görev ekle'}
        </Button>
      </div>

      {subtaskCount > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ListTree className="size-4" aria-hidden="true" />
          {completedSubtaskCount}/{subtaskCount} alt görev tamamlandı
        </div>
      )}

      {subtasks.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {subtasks.map((subtask) => (
            <li key={subtask.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-left transition-colors duration-150 hover:border-border hover:bg-muted/50"
                onClick={() => onOpenSubtask(subtask.id)}
              >
                <span
                  className={
                    subtask.canonicalStatus === 'COMPLETED'
                      ? 'text-muted-foreground line-through'
                      : 'min-w-0 flex-1 truncate'
                  }
                >
                  {subtask.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {PRIORITY_LABELS[subtask.priority]}
                </span>
                <Badge variant="neutral">{statusLabel(subtask.canonicalStatus)}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = title.trim();
            if (trimmed.length > 0) {
              createSubtask.mutate(trimmed);
            }
          }}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Alt görev başlığı"
            aria-label="Alt görev başlığı"
          />
          <Button
            type="submit"
            size="sm"
            className="shrink-0 transition-transform duration-150 active:scale-[0.97]"
            disabled={createSubtask.isPending || title.trim().length === 0}
          >
            {createSubtask.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </form>
      )}

      {createSubtask.isError && (
        <p className="mt-2 text-sm text-destructive">
          Alt görev eklenemedi: {createSubtask.error.message}
        </p>
      )}
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

function describeRecurrence(rule: NonNullable<RecurrenceInfo>['activeRule']): string {
  const freq = FREQUENCY_LABELS[rule.frequency] ?? rule.frequency;
  const interval = rule.interval > 1 ? ` ${rule.interval}` : '';

  if (rule.frequency === 'WEEKLY' && rule.selectedWeekdays.length > 0) {
    const days = rule.selectedWeekdays.map((day) => WEEKDAY_LABELS[day] ?? String(day)).join(', ');
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
  csrfToken,
}: {
  readonly taskId: string;
  readonly taskData: TaskData;
  readonly csrfToken: string | undefined;
}) {
  const queryClient = useQueryClient();
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
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Tekrarlama</div>
            <div className="mt-1 font-medium">{describeRecurrence(recurrence.activeRule)}</div>
            {recurrence.series.state !== 'ACTIVE' && (
              <div className="mt-1 text-xs text-muted-foreground">Duraklatılmış</div>
            )}
          </div>
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
    );
  }

  if (showForm) {
    return (
      <div className="rounded-xl border bg-card p-4">
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
    <div className="rounded-xl border bg-card p-4">
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
