import type { TaskReminder } from './reminder.entity';

export type SnoozeUnit = 'MINUTES' | 'HOURS' | 'DAYS';

export type SnoozeTarget = 'PLANNED' | 'DUE' | 'BOTH';

const UNIT_MS: Record<SnoozeUnit, number> = {
  MINUTES: 60_000,
  HOURS: 3_600_000,
  DAYS: 86_400_000,
};

export function addSnoozeDelta(date: Date, amount: number, unit: SnoozeUnit): Date {
  return new Date(date.getTime() + amount * UNIT_MS[unit]);
}

export function snoozeTaskDates(input: {
  plannedAt: Date | null;
  dueAt: Date | null;
  target: SnoozeTarget;
  amount: number;
  unit: SnoozeUnit;
}): { plannedAt: Date | null; dueAt: Date | null } {
  const deltaMs = input.amount * UNIT_MS[input.unit];
  let plannedAt = input.plannedAt;
  let dueAt = input.dueAt;

  if (input.target === 'PLANNED' || input.target === 'BOTH') {
    if (plannedAt !== null) {
      plannedAt = new Date(plannedAt.getTime() + deltaMs);
    }
  }

  if (input.target === 'DUE' || input.target === 'BOTH') {
    if (dueAt !== null) {
      dueAt = new Date(dueAt.getTime() + deltaMs);
    }
  }

  return { plannedAt, dueAt };
}

export function computeSnoozedReminderAt(input: {
  state: TaskReminder['state'];
  scheduledAt: Date;
  amount: number;
  unit: SnoozeUnit;
  now: Date;
}): Date {
  if (input.state === 'TRIGGERED') {
    return addSnoozeDelta(input.now, input.amount, input.unit);
  }
  return addSnoozeDelta(input.scheduledAt, input.amount, input.unit);
}