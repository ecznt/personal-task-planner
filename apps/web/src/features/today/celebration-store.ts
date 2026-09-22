'use client';

import { useSyncExternalStore } from 'react';

let triggerCount = 0;
const listeners = new Set<() => void>();

export function celebrateTaskCompleted() {
  triggerCount += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return triggerCount;
}

function getServerSnapshot() {
  return 0;
}

export function useCelebrationTrigger() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}