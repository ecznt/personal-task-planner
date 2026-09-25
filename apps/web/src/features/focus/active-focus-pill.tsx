'use client';

import { ProgressRing } from '@/features/today/progress-ring';

import { useFocus } from './use-focus';
import { FocusPlant } from './focus-plant';
import { formatRemaining, plantTierForMinutes } from './focus-types';

export function ActiveFocusPill() {
  const { active, remainingMs, progress, openFocus } = useFocus();

  if (active === null) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openFocus}
      aria-label="Odak zamanlayıcıyı aç"
      className="animate-fade-slide-in fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-full border border-border/70 bg-card/90 py-1.5 pr-3.5 pl-1.5 shadow-surface backdrop-blur-xl transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-surface-hover active:scale-[0.98] md:right-6 md:bottom-6"
    >
      <span className="relative grid size-11 shrink-0 place-items-center">
        <ProgressRing
          value={Math.round(progress * 100)}
          size={44}
          strokeWidth={4}
          label="Odak süresi"
          className="absolute inset-0"
        />
        <FocusPlant
          tier={plantTierForMinutes(active.durationMinutes)}
          progress={progress}
          animated
          className="size-7"
        />
      </span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {formatRemaining(remainingMs)}
      </span>
    </button>
  );
}