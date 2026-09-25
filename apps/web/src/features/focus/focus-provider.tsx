'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { fetchCsrf } from '@/features/auth/auth-api';
import { celebrateTaskCompleted } from '@/features/today/celebration-store';

import { ActiveFocusPill } from './active-focus-pill';
import {
  clearPendingRecord,
  getActiveSnapshot,
  getPendingRecord,
  setActiveStore,
  stashPendingRecord,
  subscribeActiveStore,
} from './focus-active-store';
import { focusSessionsQueryKey, focusStatisticsQueryKey, postFocusSession } from './focus-api';
import { FocusContext } from './focus-context';
import { FocusSheet } from './focus-sheet';
import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  type ActiveFocus,
  type PendingFocusRecord,
} from './focus-types';

const TICK_MS = 500;

export function FocusProvider({ children }: { readonly children: ReactNode }) {
  const queryClient = useQueryClient();
  const active = useSyncExternalStore(subscribeActiveStore, getActiveSnapshot, () => null);
  const [now, setNow] = useState(() => Date.now());
  const [sheetOpen, setSheetOpen] = useState(false);
  const completingRef = useRef<string | null>(null);

  const remainingMs = active !== null ? Math.max(0, Date.parse(active.targetEndAt) - now) : 0;
  const progress =
    active !== null ? Math.min(1, 1 - remainingMs / (active.durationMinutes * 60_000)) : 0;

  async function submitRecord(pending: PendingFocusRecord) {
    try {
      const csrf = await fetchCsrf();
      await postFocusSession(pending, csrf.token);
      clearPendingRecord();
    } catch {
      stashPendingRecord(pending);
      toast.error('Odak seansın kaydedilemedi. Bir sonraki açılışta tekrar denenir.');
    }
  }

  useEffect(() => {
    const pending = getPendingRecord();
    if (pending !== null) {
      void submitRecord(pending);
    }
  }, []);

  useEffect(() => {
    if (active === null) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (active === null) {
      return;
    }
    if (now < Date.parse(active.targetEndAt)) {
      return;
    }
    if (completingRef.current === active.clientKey) {
      return;
    }
    completingRef.current = active.clientKey;

    const pending: PendingFocusRecord = {
      startedAt: active.startedAt,
      completedAt: new Date(active.targetEndAt).toISOString(),
      durationMinutes: active.durationMinutes,
      clientKey: active.clientKey,
    };

    setActiveStore(null);
    celebrateTaskCompleted();
    toast.success('Odak tamamlandı — bahçene yeni bir bitki eklendi.');
    void submitRecord(pending);
    void queryClient.invalidateQueries({ queryKey: focusSessionsQueryKey });
    void queryClient.invalidateQueries({ queryKey: focusStatisticsQueryKey });
  }, [active, now, queryClient]);

  function startFocus(minutes: number) {
    const clamped = Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, Math.round(minutes)));
    const startedAt = new Date();
    const next: ActiveFocus = {
      startedAt: startedAt.toISOString(),
      targetEndAt: new Date(startedAt.getTime() + clamped * 60_000).toISOString(),
      durationMinutes: clamped,
      clientKey: crypto.randomUUID(),
    };

    setActiveStore(next);
    setNow(startedAt.getTime());
    setSheetOpen(true);
  }

  function cancelFocus() {
    completingRef.current = null;
    setActiveStore(null);
  }

  return (
    <FocusContext.Provider
      value={{
        active,
        remainingMs,
        progress,
        isOpen: sheetOpen,
        startFocus,
        cancelFocus,
        openFocus: () => setSheetOpen(true),
        closeFocus: () => setSheetOpen(false),
      }}
    >
      {children}
      <FocusSheet />
      <ActiveFocusPill />
    </FocusContext.Provider>
  );
}