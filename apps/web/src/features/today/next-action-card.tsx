'use client';

import { AlignLeft, CheckCircle2, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskPriorityBadge } from '@/features/tasks/task-badge';
import { useTaskInspector } from '@/features/tasks/task-inspector-context';

export type NextActionTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly version: number;
  readonly reasons: readonly string[];
  readonly plannedAt: string | null;
  readonly dueAt: string | null;
  readonly isBlocked?: boolean;
};

type NextActionCardProps = {
  readonly remaining: readonly NextActionTask[];
  readonly onComplete: (task: NextActionTask) => void;
};

function sortByUrgency(tasks: readonly NextActionTask[]): NextActionTask[] {
  return [...tasks]
    .filter((task) => task.isBlocked !== true)
    .sort((left, right) => {
    const rank = (task: NextActionTask): number => {
      if (task.reasons.includes('overdue')) return 0;
      if (task.reasons.includes('dueToday')) return 1;
      return 2;
    };

    const rankDiff = rank(left) - rank(right);
    if (rankDiff !== 0) return rankDiff;

    const priorityWeight: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    };
    const priorityDiff =
      (priorityWeight[right.priority] ?? 0) - (priorityWeight[left.priority] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;

    const leftTime = new Date(left.plannedAt ?? left.dueAt ?? 0).getTime();
    const rightTime = new Date(right.plannedAt ?? right.dueAt ?? 0).getTime();
    return leftTime - rightTime;
  });
}

function reasonLabel(task: NextActionTask): string {
  if (task.reasons.includes('overdue')) return 'Gecikmiş görev';
  if (task.reasons.includes('dueToday')) return 'Bugün bitiyor';
  return 'Bugün planlandı';
}

export function NextActionCard({ remaining, onComplete }: NextActionCardProps) {
  const { openTask } = useTaskInspector();
  const next = sortByUrgency(remaining)[0];

  if (next === undefined) {
    return null;
  }

  return (
    <section
      aria-label="Şimdi ne yapmalıyım?"
      className="card-surface animate-fade-slide-in relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-surface"
      style={{ animationDelay: '80ms' }}
    >
      <div
        className="absolute -top-14 -left-10 size-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          Şimdi ne yapmalıyım?
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => openTask(next.id)}
            className="group flex min-w-0 flex-1 items-start gap-3 rounded-lg p-1 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none hover:bg-accent"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground shadow-inner-edge ring-1 ring-border">
              <AlignLeft className="size-4 text-primary" aria-hidden="true" />
            </span>
            <span className="min-w-0 space-y-1">
              <span className="block truncate text-sm font-medium group-hover:underline">
                {next.title}
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="info">{reasonLabel(next)}</Badge>
                <TaskPriorityBadge priority={next.priority} />
              </span>
            </span>
          </button>

          <Button
            type="button"
            onClick={() => onComplete(next)}
            className="shrink-0 gap-1.5 transition-transform duration-[var(--duration-fast)] active:scale-[0.97]"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Tamamla
          </Button>
        </div>
      </div>
    </section>
  );
}