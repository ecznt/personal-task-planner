'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

import { useFocus } from './use-focus';
import { FocusGarden } from './focus-garden';
import { FocusPlant } from './focus-plant';
import { FocusStats } from './focus-stats';
import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  FOCUS_PRESET_MINUTES,
  formatDurationLabel,
  formatRemaining,
  plantTierForMinutes,
} from './focus-types';

const TIER_HINT: Record<string, string> = {
  flower: '15–24 dk çiçek',
  plant: '25–59 dk bitki',
  tree: '60+ dk ağaç',
};

const TIER_LABEL: Record<string, string> = {
  flower: 'Çiçek',
  plant: 'Bitki',
  tree: 'Ağaç',
};

export function FocusSheet() {
  const { active, remainingMs, progress, isOpen, startFocus, cancelFocus, closeFocus } =
    useFocus();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');

  const handleStart = () => {
    const minutes = customMinutes.trim() === '' ? selectedMinutes : Number(customMinutes);
    if (Number.isFinite(minutes) && minutes >= FOCUS_MIN_MINUTES && minutes <= FOCUS_MAX_MINUTES) {
      startFocus(minutes);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && closeFocus()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Odak</SheetTitle>
          <SheetDescription>
            Sayacı başlat, bitkin büyüsün. Sayfa geçişleri sayacı durdurmaz; yalnızca açıkça iptal
            etmek seansı sonlandırır.
          </SheetDescription>
        </SheetHeader>

        {active !== null ? (
          <div className="flex flex-col items-center gap-4 px-4 pb-6 pt-2">
            <FocusPlant
              tier={plantTierForMinutes(active.durationMinutes)}
              progress={progress}
              animated
              className="h-44 w-36"
            />
            <div className="tabular-nums text-3xl font-semibold tracking-tight md:text-4xl">
              {formatRemaining(remainingMs)}
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground shadow-inner-edge">
              {TIER_LABEL[plantTierForMinutes(active.durationMinutes)]} ·{' '}
              {formatDurationLabel(active.durationMinutes)}
            </span>
            <div className="grid w-full grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => closeFocus()}>
                Gizle
              </Button>
              <Button type="button" variant="destructive" onClick={cancelFocus}>
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4 pb-6">
            <div className="flex flex-col items-center gap-1 pt-2">
              <FocusPlant
                tier={plantTierForMinutes(selectedMinutes)}
                progress={1}
                animated
                className="h-28 w-24 opacity-90"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Bu seansı tamamla → {TIER_LABEL[plantTierForMinutes(selectedMinutes)]} eklenir
              </span>
            </div>

            <div className="flex gap-1.5" role="group" aria-label="Odak süresi">
              {FOCUS_PRESET_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(minutes);
                    setCustomMinutes('');
                  }}
                  aria-pressed={selectedMinutes === minutes && customMinutes === ''}
                  className={
                    selectedMinutes === minutes && customMinutes === ''
                      ? 'flex-1 rounded-lg border border-ring/40 bg-secondary px-2 py-1.5 text-sm font-medium text-foreground shadow-inner-edge ring-3 ring-ring/20'
                      : 'flex-1 rounded-lg border border-border/70 bg-card px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground'
                  }
                >
                  {minutes}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={FOCUS_MIN_MINUTES}
                max={FOCUS_MAX_MINUTES}
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                placeholder={`Özel (${FOCUS_MIN_MINUTES}–${FOCUS_MAX_MINUTES} dk)`}
                inputMode="numeric"
              />
              <span className="shrink-0 text-sm text-muted-foreground">dk</span>
            </div>

            <Button type="button" onClick={handleStart}>
              Başlat
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {TIER_HINT.flower} · {TIER_HINT.plant} · {TIER_HINT.tree}
            </p>

            <div className="space-y-1.5 border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold">İstatistik</h3>
              <FocusStats enabled={isOpen} />
            </div>

            <div className="space-y-1.5 border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold">Bahçe</h3>
              <FocusGarden enabled={isOpen} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}