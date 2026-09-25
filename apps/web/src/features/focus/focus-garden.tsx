'use client';

import { useQuery } from '@tanstack/react-query';

import { Spinner } from '@/components/ui/spinner';

import { fetchFocusSessions, focusSessionsQueryKey } from './focus-api';
import { FocusPlant } from './focus-plant';
import { formatDurationLabel, plantTierForMinutes } from './focus-types';

export function FocusGarden({ enabled }: { readonly enabled: boolean }) {
  const sessions = useQuery({
    queryKey: focusSessionsQueryKey,
    queryFn: fetchFocusSessions,
    enabled,
  });

  if (!enabled || sessions.isLoading) {
    return (
      <div className="flex justify-center py-6" aria-label="Bahçe yükleniyor">
        <Spinner className="size-4" />
      </div>
    );
  }

  const rows = sessions.data ?? [];

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
        Bahçe henüz boş — ilk odak seansını bitir, buraya bir bitki ekle.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6" aria-label="Bahçen">
      {rows.map((session) => (
        <div
          key={session.id}
          className="animate-fade-slide-in flex flex-col items-center rounded-lg border border-border/50 bg-card px-1 py-2"
          title={`${formatDurationLabel(session.durationMinutes)} · ${new Date(session.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`}
        >
          <FocusPlant
            tier={plantTierForMinutes(session.durationMinutes)}
            progress={1}
            animated={false}
            className="h-14 w-11"
          />
          <span className="mt-1 text-[10px] font-medium tabular-nums text-muted-foreground">
            {formatDurationLabel(session.durationMinutes)}
          </span>
        </div>
      ))}
    </div>
  );
}