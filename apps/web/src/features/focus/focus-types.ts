export type ActiveFocus = {
  readonly startedAt: string;
  readonly targetEndAt: string;
  readonly durationMinutes: number;
  readonly clientKey: string;
};

export type PendingFocusRecord = {
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMinutes: number;
  readonly clientKey: string;
};

export type FocusSession = {
  readonly id: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMinutes: number;
  readonly clientKey: string;
  readonly createdAt: string;
};

export type FocusDayStats = {
  readonly date: string;
  readonly minutes: number;
  readonly sessions: number;
};

export type FocusStatistics = {
  readonly timezone: string;
  readonly totalSessions: number;
  readonly totalMinutes: number;
  readonly todaySessions: number;
  readonly todayMinutes: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly days: readonly FocusDayStats[];
};

export type PlantTier = 'flower' | 'plant' | 'tree';

export const FOCUS_ACTIVE_STORAGE_KEY = 'planner.focus.active';
export const FOCUS_PENDING_STORAGE_KEY = 'planner.focus.pending';

export const FOCUS_MIN_MINUTES = 5;
export const FOCUS_MAX_MINUTES = 240;

export const FOCUS_PRESET_MINUTES = [15, 25, 45, 60] as const;

export function plantTierForMinutes(minutes: number): PlantTier {
  if (minutes >= 60) {
    return 'tree';
  }
  if (minutes >= 25) {
    return 'plant';
  }
  return 'flower';
}

export function stageForProgress(progress: number): number {
  if (progress >= 1) {
    return 3;
  }
  if (progress >= 0.75) {
    return 2;
  }
  if (progress >= 0.4) {
    return 1;
  }
  return 0;
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
  }
  return `${minutes} dk`;
}