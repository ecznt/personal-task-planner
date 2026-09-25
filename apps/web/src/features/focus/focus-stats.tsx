'use client';

import { useQuery } from '@tanstack/react-query';

import { Spinner } from '@/components/ui/spinner';

import { fetchFocusStatistics, focusStatisticsQueryKey } from './focus-api';
import { formatDurationLabel } from './focus-types';

function StatCell({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border/70 bg-card px-3 py-2">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function FocusStats({ enabled }: { readonly enabled: boolean }) {
  const stats = useQuery({
    queryKey: focusStatisticsQueryKey,
    queryFn: fetchFocusStatistics,
    enabled,
  });

  if (!enabled || stats.isLoading) {
    return (
      <div className="flex justify-center py-6" aria-label="Odak istatistikleri yükleniyor">
        <Spinner className="size-4" />
      </div>
    );
  }

  const data = stats.data;

  if (data === undefined) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        İstatistikler yüklenemedi. Daha sonra tekrar deneyin.
      </p>
    );
  }

  const maxMinutes = Math.max(1, ...data.days.map((day) => day.minutes));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatCell label="Bugün" value={formatDurationLabel(data.todayMinutes)} />
        <StatCell label="Seri" value={`${data.currentStreak} gün`} />
        <StatCell label="Rekor" value={`${data.bestStreak} gün`} />
      </div>

      <div className="flex h-16 items-end gap-1.5" aria-label="Son 7 gün">
        {data.days.map((day) => (
          <div
            key={day.date}
            className="group flex flex-1 flex-col items-center gap-1"
            title={`${formatDurationLabel(day.minutes)} · ${day.sessions} seans`}
          >
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#9db4f2] to-[#5e6ad2] transition-opacity group-hover:opacity-80"
              style={{
                height: `${Math.max(3, (day.minutes / maxMinutes) * 100)}%`,
                opacity: day.minutes === 0 ? 0.25 : 1,
              }}
            />
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
              {new Date(`${day.date}T00:00:00`).getDate()}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Toplam <span className="font-medium tabular-nums text-foreground">{formatDurationLabel(data.totalMinutes)}</span> ·{' '}
        <span className="font-medium tabular-nums text-foreground">{data.totalSessions}</span> seans
      </p>
    </div>
  );
}