'use client';

import { apiClient } from '@planner/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PlayCircle, CircleDot } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/list-skeleton';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

type TodayTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
  readonly version: number;
  readonly areaId: string;
  readonly reasons: readonly string[];
};

type TodaySection = {
  readonly count: number;
  readonly tasks: readonly TodayTask[];
};

type TodayResponse = {
  today: string;
  timezone: string;
  overdue: TodaySection;
  plannedToday: TodaySection;
  dueToday: TodaySection;
  completedToday: TodaySection;
};

const REASON_LABELS: Record<string, string> = {
  overdue: 'Gecikmiş',
  plannedToday: 'Bugün planlandı',
  dueToday: 'Bugün bitiş',
  completedToday: 'Bugün tamamlandı',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SectionHeader({
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
  task: TodayTask;
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
      className="animate-fade-slide-in flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors duration-150 hover:bg-accent"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link href={`/app/areas/tasks/${task.id}`} className="min-w-0 flex-1">
        <div className="truncate font-medium">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {task.reasons.map((reason) => (
            <Badge
              key={reason}
              variant={
                reason === 'overdue' ? 'danger' : reason === 'completedToday' ? 'success' : 'info'
              }
            >
              {REASON_LABELS[reason] ?? reason}
            </Badge>
          ))}
          <TaskPriorityBadge priority={task.priority} />
          {task.plannedAt && <span>Plan: {formatTime(task.plannedAt)}</span>}
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
        {isCompleted && (
          <Badge variant="success" className="gap-1">
            <CircleDot className="size-3" />
            Tamamlandı
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TodayView() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overdue: true,
    planned: true,
    due: true,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const queryClient = useQueryClient();

  const today = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await apiClient.get({
        url: '/api/v1/tasks/today',
        query: { timezone },
      });

      if (result.error !== undefined) {
        throw new Error('Bugün yüklenemedi.');
      }

      return result.data as TodayResponse;
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
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'kanban'] });
      toast.success('Durum güncellendi');
    },
  });

  const handleStatusChange = (
    taskId: string,
    target: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
    version: number,
  ) => {
    moveMutation.mutate({ taskId, target, version });
  };

  if (today.isLoading) {
    return <ListSkeleton rows={6} />;
  }

  if (today.isError || !today.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>Bugün yüklenemedi.</AlertDescription>
      </Alert>
    );
  }

  const data = today.data;
  const hasAnyTasks =
    data.overdue.count > 0 ||
    data.plannedToday.count > 0 ||
    data.dueToday.count > 0 ||
    data.completedToday.count > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bugün ·{' '}
          {new Date(data.today + 'T00:00:00').toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h1>
        <p className="text-sm text-muted-foreground">{data.timezone}</p>
      </div>

      {!hasAnyTasks ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Bugün için planlanmış, gecikmiş veya bitiş tarihi olan görev yok.</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link
              href="/app/tasks"
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-150 active:scale-[0.97] hover:bg-primary/90"
            >
              Görevlere Git
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.overdue.count > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title="Gecikmiş"
                count={data.overdue.count}
                id="today-section-overdue"
                open={openSections['overdue'] ?? true}
                onToggle={() => toggleSection('overdue')}
              />
              {openSections.overdue && (
                <div id="today-section-overdue" className="space-y-2 pl-0">
                  {data.overdue.tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {data.plannedToday.count > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title="Bugün Planlandı"
                count={data.plannedToday.count}
                id="today-section-planned"
                open={openSections['planned'] ?? true}
                onToggle={() => toggleSection('planned')}
              />
              {openSections.planned && (
                <div id="today-section-planned" className="space-y-2">
                  {data.plannedToday.tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {data.dueToday.count > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title="Bugün Bitiş"
                count={data.dueToday.count}
                id="today-section-due"
                open={openSections['due'] ?? true}
                onToggle={() => toggleSection('due')}
              />
              {openSections.due && (
                <div id="today-section-due" className="space-y-2">
                  {data.dueToday.tasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {data.completedToday.count > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
                aria-controls="today-section-completed"
                className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm font-medium transition-colors duration-150 active:scale-[0.97] hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span>Tamamlanan ({data.completedToday.count})</span>
                <span aria-hidden="true" className="text-muted-foreground">
                  {showCompleted ? '−' : '+'}
                </span>
              </button>
              {showCompleted && (
                <div
                  id="today-section-completed"
                  className="accordion-content"
                  data-open={showCompleted}
                >
                  <div>
                    <div className="space-y-2 pt-1">
                      {data.completedToday.tasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
