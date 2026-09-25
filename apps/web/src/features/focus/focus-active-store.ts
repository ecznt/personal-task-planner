'use client';

import type { ActiveFocus, PendingFocusRecord } from './focus-types';
import { FOCUS_ACTIVE_STORAGE_KEY } from './focus-types';
import {
  readActiveStorage,
  readPendingStorage,
  writeActiveStorage,
  writePendingStorage,
} from './focus-storage';

let active: ActiveFocus | null = readActiveStorage();
const listeners = new Set<() => void>();

function emitActiveChange() {
  for (const listener of listeners) listener();
}

export function getActiveSnapshot(): ActiveFocus | null {
  return active;
}

export function setActiveStore(next: ActiveFocus | null): void {
  active = next;
  writeActiveStorage(next);
  emitActiveChange();
}

function subscribeActiveStore(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === FOCUS_ACTIVE_STORAGE_KEY) {
      active = readActiveStorage();
      emitActiveChange();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export { subscribeActiveStore };

export function getPendingRecord(): PendingFocusRecord | null {
  return readPendingStorage();
}

export function clearPendingRecord(): void {
  writePendingStorage(null);
}

export function stashPendingRecord(pending: PendingFocusRecord): void {
  writePendingStorage(pending);
}