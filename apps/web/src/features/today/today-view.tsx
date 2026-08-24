'use client';

import { apiClient } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

type TodayTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: string;
  readonly dueAt: string | null;
  readonly plannedAt: string | null;
  readonly lifecycleState: string;
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

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
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
  defaultOpen = true,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
    >
      <span>
        {title} ({count})
      </span>
      <span className="text-muted-foreground">{isOpen ? '−' : '+'}</span>
    </button>
  );
}

function TaskCard({ task }: { task: TodayTask }) {
  return (
    <Link
      href={`/app/areas/tasks/${task.id}`}
      className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {task.reasons.map((reason) => (
            <span
              key={reason}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                reason === 'overdue'
                  ? 'bg-red-100 text-red-700'
                  : reason === 'completedToday'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {REASON_LABELS[reason] ?? reason}
            </span>
          ))}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              task.priority === 'HIGH'
                ? 'bg-red-100 text-red-700'
                : task.priority === 'LOW'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.plannedAt && <span>Plan: {formatTime(task.plannedAt)}</span>}
          {task.dueAt && (
            <span>
              Bitiş: {formatDate(task.dueAt)} {formatTime(task.dueAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TodayView() {
  const [showCompleted, setShowCompleted] = useState(false);

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

  if (today.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
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
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Görevlere Git
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.overdue.count > 0 && (
            <div className="space-y-2">
              <SectionHeader title="Gecikmiş" count={data.overdue.count} />
              <div className="space-y-2 pl-0">
                {data.overdue.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {data.plannedToday.count > 0 && (
            <div className="space-y-2">
              <SectionHeader title="Bugün Planlandı" count={data.plannedToday.count} />
              <div className="space-y-2">
                {data.plannedToday.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {data.dueToday.count > 0 && (
            <div className="space-y-2">
              <SectionHeader title="Bugün Bitiş" count={data.dueToday.count} />
              <div className="space-y-2">
                {data.dueToday.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {data.completedToday.count > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
              >
                <span>Tamamlanan ({data.completedToday.count})</span>
                <span className="text-muted-foreground">{showCompleted ? '−' : '+'}</span>
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {data.completedToday.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
