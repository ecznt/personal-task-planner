'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';

import { apiClient } from '@planner/api-client';
import { ListSkeleton } from '@/components/list-skeleton';

type WeeklyDay = {
  readonly date: string;
  readonly count: number;
};

type WeeklyStatsResponse = {
  readonly timezone: string;
  readonly totalCompleted: number;
  readonly days: readonly WeeklyDay[];
};

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function WeeklyStats() {
  const weekly = useQuery({
    queryKey: ['tasks', 'statistics', 'weekly'],
    queryFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await apiClient.get({
        url: '/api/v1/tasks/statistics/weekly',
        query: { timezone },
      });

      if (result.error !== undefined) {
        throw new Error('Haftalık istatistikler yüklenemedi.');
      }

      return result.data as WeeklyStatsResponse;
    },
  });

  if (weekly.isLoading) {
    return <ListSkeleton rows={3} />;
  }

  if (weekly.isError || !weekly.data) {
    return null;
  }

  const { days, totalCompleted } = weekly.data;
  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const today = days[days.length - 1];

  return (
    <section
      aria-label="Haftalık istatistikler"
      className="card-surface animate-fade-slide-in rounded-xl border border-border/70 bg-card p-4 shadow-surface"
      style={{ animationDelay: '80ms' }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-medium">
          <TrendingUp className="size-4 text-primary" aria-hidden="true" />
          Haftalık tamamlanan
        </h2>
        <p className="text-xs text-muted-foreground">
          {totalCompleted} görev{' '}
          {today && today.count > 0 ? (
            <span className="text-foreground">· bugün {today.count}</span>
          ) : null}
        </p>
      </div>

      <div className="mt-4 flex h-24 items-end gap-1.5" role="img" aria-label="Son 7 gün tamamlanan görev grafiği">
        {days.map((day, index) => {
          const height = Math.round((day.count / maxCount) * 100);
          const isToday = index === days.length - 1;

          return (
            <div
              key={day.date}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
              title={`${formatDate(day.date)}: ${day.count}`}
            >
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                {day.count > 0 ? day.count : ''}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary/70 transition-colors duration-150 group-hover:from-primary/50 group-hover:to-primary"
                role="presentation"
                style={{
                  height: day.count === 0 ? '3px' : `${height}%`,
                  ...(isToday ? { boxShadow: '0 0 0 1px rgba(94,106,210,0.35)' } : {}),
                }}
              />
              <span
                className={`text-[10px] tabular-nums ${isToday ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
              >
                {WEEKDAY_LABELS[index % WEEKDAY_LABELS.length]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}