import type { RecurrenceRule } from '../domain/task.entity';

export type RecurrenceInput = {
  readonly frequency: RecurrenceRule['frequency'];
  readonly interval: number;
  readonly selectedWeekdays: readonly number[];
  readonly dayOfMonth: number | null;
  readonly monthOfYear: number | null;
  readonly localTime: string | null;
};

export function calculateNextOccurrence(
  anchor: Date,
  rule: RecurrenceInput,
): Date {
  const base = new Date(anchor);

  switch (rule.frequency) {
    case 'DAILY':
      return addDays(base, rule.interval);

    case 'WEEKDAYS':
      return nextWeekday(base);

    case 'WEEKLY':
      return nextWeeklyMatch(base, rule.interval, rule.selectedWeekdays);

    case 'MONTHLY':
      return nextMonthlyMatch(base, rule.interval, rule.dayOfMonth);

    case 'YEARLY':
      return nextYearlyMatch(base, rule.interval, rule.monthOfYear, rule.dayOfMonth);
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function nextWeekday(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);

  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function nextWeeklyMatch(
  anchor: Date,
  interval: number,
  selectedWeekdays: readonly number[],
): Date {
  if (selectedWeekdays.length === 0) {
    return addDays(anchor, 7 * interval);
  }

  const anchorWeekday = anchor.getDay();
  const sortedDays = [...selectedWeekdays].sort((a, b) => a - b);

  for (const day of sortedDays) {
    if (day > anchorWeekday) {
      const daysAhead = day - anchorWeekday;
      return addDays(anchor, daysAhead);
    }
  }

  const firstDayNextWeek = sortedDays[0]!;
  const daysToNextWeek = 7 - anchorWeekday + firstDayNextWeek;
  return addDays(anchor, daysToNextWeek + 7 * (interval - 1));
}

function nextMonthlyMatch(
  anchor: Date,
  interval: number,
  dayOfMonth: number | null,
): Date {
  if (dayOfMonth === null) {
    const result = new Date(anchor);
    result.setMonth(result.getMonth() + interval);
    return result;
  }

  const result = new Date(anchor);
  result.setMonth(result.getMonth() + interval);

  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(dayOfMonth, lastDay));

  return result;
}

function nextYearlyMatch(
  anchor: Date,
  interval: number,
  monthOfYear: number | null,
  dayOfMonth: number | null,
): Date {
  const result = new Date(anchor);
  result.setFullYear(result.getFullYear() + interval);

  if (monthOfYear !== null) {
    result.setMonth(monthOfYear - 1);
  }

  if (dayOfMonth !== null) {
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(dayOfMonth, lastDay));
  }

  return result;
}

export function buildGenerationKey(seriesId: string, predecessorTaskId: string): string {
  return `${seriesId}:${predecessorTaskId}`;
}
