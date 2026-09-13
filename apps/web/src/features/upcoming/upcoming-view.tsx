'use client';

import { apiClient } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/empty-state';
import { ListSkeleton } from '@/components/list-skeleton';
import { PageHeader } from '@/components/page-header';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type UpcomingTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
  readonly version: number;
  readonly areaId: string;
};

type UpcomingDayGroup = {
  readonly date: string;
  readonly planned: readonly UpcomingTask[];
  readonly due: readonly UpcomingTask[];
};

type UpcomingResponse = {
  timezone: string;
  overdue: readonly UpcomingTask[];
  days: readonly UpcomingDayGroup[];
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

function localDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function shiftKey(days: number): string {
  const shifted = new Date();
  shifted.setDate(shifted.getDate() + days);
  return localDateKey(shifted, Intl.DateTimeFormat().resolvedOptions().timeZone);
}

function dayTitle(day: string): string {
  if (day === shiftKey(0)) {
    return 'Bugün';
  }

  if (day === shiftKey(1)) {
    return 'Yarın';
  }

  return new Date(`${day}T00:00:00`).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function DayHeader({
  title,
  count,
  id,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  id: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm font-medium transition-colors duration-150 active:scale-[0.97] hover:bg-accent"
    >
      <span>
        {title} ({count})
      </span>
      <span aria-hidden="true" className="text-muted-foreground">
        {open ? '−' : '+'}
      </span>
    </button>
  );
}

function TaskCard({
  task,
  index,
  onStatusChange,
}: {
  task: UpcomingTask;
  index: number;
  onStatusChange: (
    taskId: string,
    target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
    version: number,
  ) => void;
}) {
  const isCompleted = task.canonicalStatus === 'COMPLETED';

  return (
    <div
      className="card-surface animate-fade-slide-in flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-surface transition-all duration-150 hover:border-border hover:shadow-surface-hover"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link href={`/app/areas/tasks/${task.id}`} className="min-w-0 flex-1">
        <div className="truncate font-medium">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <TaskPriorityBadge priority={task.priority} />
          {task.plannedAt && <span>Plan: {formatDate(task.plannedAt)} {formatTime(task.plannedAt)}</span>}
          {task.dueAt && (
            <span>
              Bitiş: {formatDate(task.dueAt)} {formatTime(task.dueAt)}
            </span>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 gap-1">
        {!isCompleted && task.canonicalStatus !== 'IN_PROGRESS' && (
          <button
            type="button"
            onClick={() => onStatusChange(task.id, 'IN_PROGRESS', task.version)}
            className="rounded p-1 text-muted-foreground transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-muted hover:text-foreground"
            aria-label={`${task.title} görevini Devam Ediyor'a taşı`}
          >
            <PlayCircle className="size-4" aria-hidden="true" />
          </button>
        )}
        {!isCompleted && (
          <button
            type="button"
            onClick={() => onStatusChange(task.id, 'COMPLETED', task.version)}
            className="rounded p-1 text-muted-foreground transition-transform duration-150 focus-visible:ring-2 active:scale-90 hover:bg-muted hover:text-green-600"
            aria-label={`${task.title} görevini tamamlandı olarak işaretle`}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </button>
        )}
        {isCompleted && <span className="text-xs text-muted-foreground">Tamamlandı</span>}
      </div>
    </div>
  );
}

export function UpcomingView() {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const upcoming = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await apiClient.get({
        url: '/api/v1/tasks/upcoming',
        query: { timezone, days: 14 },
      });

      if (result.error !== undefined) {
        throw new Error('Yaklaşan görevler yüklenemedi.');
      }

      return result.data as UpcomingResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      taskId,
      target,
      version,
    }: {
      taskId: string;
      target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
      version: number;
    }) => {
      const csrf = await fetchCsrf();
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await apiClient.post({
        url: '/api/v1/tasks/kanban-moves',
        body: { taskId, targetCanonicalStatus: target },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf.token,
          'If-Match': String(version),
        },
      });

      if (result.error !== undefined) throw apiError(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      toast.success('Durum güncellendi');
    },
  });

  const toggleDay = (key: string) =>
    setOpenDays((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

  if (upcoming.isLoading) {
    return <ListSkeleton rows={6} />;
  }

  if (upcoming.isError || !upcoming.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>Yaklaşan görevler yüklenemedi.</AlertDescription>
      </Alert>
    );
  }

  const data = upcoming.data;
  const hasAnyTasks = data.overdue.length > 0 || data.days.some((day) => day.planned.length + day.due.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yaklaşan"
        eyebrow="Yaklaşan"
        description={`Önümüzdeki 14 gün · ${data.timezone}`}
      />

      {!hasAnyTasks ? (
        <EmptyState
          icon={<CalendarClock className="size-5" aria-hidden="true" />}
          title="Yaklaşan görev yok"
          description="Önümüzdeki 14 gün içinde planlanmış veya bitiş tarihi olan görev bulunmuyor."
          action={
            <Link
              href="/app/today"
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow transition-all duration-150 active:scale-[0.97] hover:bg-primary/90"
            >
              Bugüne Git
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.overdue.length > 0 && (
            <div className="space-y-2">
              <DayHeader
                title="Gecikmiş"
                count={data.overdue.length}
                id="upcoming-overdue"
                open={openDays['overdue'] ?? true}
                onToggle={() => toggleDay('overdue')}
              />
              {openDays['overdue'] !== false && (
                <div className="space-y-2">
                  {data.overdue.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={(taskId, target, version) =>
                        moveMutation.mutate({ taskId, target, version })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {data.days
            .filter((day) => day.planned.length + day.due.length > 0)
            .map((day) => {
              const tasks = [...day.planned, ...day.due];
              const open = openDays[day.date] ?? true;

              return (
                <div key={day.date} className="space-y-2">
                  <DayHeader
                    title={dayTitle(day.date)}
                    count={tasks.length}
                    id={`upcoming-${day.date}`}
                    open={open}
                    onToggle={() => toggleDay(day.date)}
                  />
                  {open && (
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onStatusChange={(taskId, target, version) =>
                            moveMutation.mutate({ taskId, target, version })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}