'use client';

import { Lock, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ProgressRing } from './progress-ring';

type TodayTask = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly reasons: readonly string[];
  readonly isBlocked?: boolean;
};

type TodayBriefingProps = {
  readonly overdue: readonly TodayTask[];
  readonly plannedToday: readonly TodayTask[];
  readonly dueToday: readonly TodayTask[];
  readonly completedToday: readonly TodayTask[];
};

export function TodayBriefing({
  overdue,
  plannedToday,
  dueToday,
  completedToday,
}: TodayBriefingProps) {
  const remaining = [...overdue, ...plannedToday, ...dueToday];
  const completed = completedToday.length;
  const total = completed + remaining.length;
  const blockedTasks = remaining.filter((task) => task.isBlocked === true);
  const blocked = blockedTasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = total > 0 && completed === total;

  return (
    <>
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
            {blocked > 0 ? (
              <Badge variant="neutral">{blocked} bloke</Badge>
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
    </section>

    {blockedTasks.length > 0 && (
      <section
        aria-label="Seni bekleyenler"
        className="card-surface animate-fade-slide-in rounded-xl border border-border/70 bg-card p-4 shadow-surface"
        style={{ animationDelay: '140ms' }}
      >
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Lock className="size-3.5 text-primary" aria-hidden="true" />
            Seni bekleyenler
          </p>
          <ul className="space-y-2">
            {blockedTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )}
    </>
  );
}

function greeting(now: Date): string {
  const hour = now.getHours();

  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  if (hour < 23) return 'İyi akşamlar';
  return 'İyi geceler';
}