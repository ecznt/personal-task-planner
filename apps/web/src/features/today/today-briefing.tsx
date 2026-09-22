'use client';

import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';
import { ProgressRing } from './progress-ring';

type TodayTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly reasons: readonly string[];
};

type TodayBriefingProps = {
  readonly overdue: readonly TodayTask[];
  readonly plannedToday: readonly TodayTask[];
  readonly dueToday: readonly TodayTask[];
  readonly completedToday: readonly TodayTask[];
};

const PRIORITY_WEIGHT: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const REASON_LABELS: Record<string, string> = {
  overdue: 'Gecikmiş',
  plannedToday: 'Bugün planlandı',
  dueToday: 'Bugün bitiş',
};

function greeting(now: Date): string {
  const hour = now.getHours();

  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  if (hour < 23) return 'İyi akşamlar';
  return 'İyi geceler';
}

export function TodayBriefing({
  overdue,
  plannedToday,
  dueToday,
  completedToday,
}: TodayBriefingProps) {
  const { openTask } = useTaskInspector();

  const remaining = [...overdue, ...plannedToday, ...dueToday];
  const completed = completedToday.length;
  const total = completed + remaining.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = total > 0 && completed === total;

  const focusTasks = [...remaining]
    .sort((left, right) => {
      const weightDiff = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority];
      if (weightDiff !== 0) return weightDiff;

      const leftOverdue = left.reasons.includes('overdue') ? 1 : 0;
      const rightOverdue = right.reasons.includes('overdue') ? 1 : 0;
      return rightOverdue - leftOverdue;
    })
    .slice(0, 3);

  return (
    <section
      aria-label="Gün özeti"
      className="card-surface animate-fade-slide-in relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-surface"
    >
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            {greeting(new Date())}
          </p>

          {allDone ? (
            <h2 className="text-lg leading-snug font-medium">Bugününü tamamladın</h2>
          ) : remaining.length > 0 ? (
            <h2 className="text-lg leading-snug font-medium">
              Bugün {remaining.length} görev seni bekliyor
            </h2>
          ) : (
            <h2 className="text-lg leading-snug font-medium">Bugün görev yok</h2>
          )}

          <p className="text-sm text-muted-foreground">
            {overdue.length > 0 ? (
              <Badge variant="danger">{overdue.length} gecikmiş</Badge>
            ) : null}{' '}
            {plannedToday.length > 0 ? (
              <Badge variant="info">{plannedToday.length} planlı</Badge>
            ) : null}{' '}
            {dueToday.length > 0 ? (
              <Badge variant="warning">{dueToday.length} bitiş</Badge>
            ) : null}{' '}
            {completed > 0 ? <Badge variant="success">{completed} tamamlandı</Badge> : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <ProgressRing value={percent} label="Bugünkü tamamlama" />
          <span className="text-xs text-muted-foreground">
            {completed}/{total || 0}
          </span>
        </div>
      </div>

      {focusTasks.length > 0 && !allDone ? (
        <div className="relative mt-4 space-y-1 border-t border-border/70 pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {focusTasks.length > 1 ? 'Önce şunlara odaklan' : 'Önce şuna odaklan'}
          </p>
          <ul className="space-y-1">
            {focusTasks.map((task, index) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  style={{ animationDelay: `${Math.min(index, 3) * 40}ms` }}
                >
                  <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <TaskPriorityBadge priority={task.priority} />
                  {task.reasons.includes('overdue') ? (
                    <Badge variant="danger">{REASON_LABELS.overdue}</Badge>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}