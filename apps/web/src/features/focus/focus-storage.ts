import {
  FOCUS_ACTIVE_STORAGE_KEY,
  FOCUS_PENDING_STORAGE_KEY,
  type ActiveFocus,
  type PendingFocusRecord,
} from './focus-types';

export function readActiveStorage(): ActiveFocus | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FOCUS_ACTIVE_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as ActiveFocus;
    if (
      typeof parsed.startedAt !== 'string' ||
      typeof parsed.targetEndAt !== 'string' ||
      typeof parsed.durationMinutes !== 'number' ||
      typeof parsed.clientKey !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveStorage(active: ActiveFocus | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (active === null) {
    window.localStorage.removeItem(FOCUS_ACTIVE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(FOCUS_ACTIVE_STORAGE_KEY, JSON.stringify(active));
}

export function readPendingStorage(): PendingFocusRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FOCUS_PENDING_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as PendingFocusRecord;
    if (
      typeof parsed.startedAt !== 'string' ||
      typeof parsed.completedAt !== 'string' ||
      typeof parsed.durationMinutes !== 'number' ||
      typeof parsed.clientKey !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePendingStorage(pending: PendingFocusRecord | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (pending === null) {
    window.localStorage.removeItem(FOCUS_PENDING_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(FOCUS_PENDING_STORAGE_KEY, JSON.stringify(pending));
}