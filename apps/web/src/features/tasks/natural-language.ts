import type { RecurrenceFormValues } from './recurrence-form';

export type ParsedQuickCapture = {
  readonly title: string;
  readonly plannedAt?: Date;
  readonly dueAt?: Date;
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly recurrence?: RecurrenceFormValues;
};

const PRIORITY_HIGH = /\bonemli\b/gi;
const PRIORITY_LOW = /\b(onemsiz|dusuk oncelikli?|dusuk oncelik)\b/gi;

const MONTHS: ReadonlyArray<{ readonly name: string; readonly index: number }> = [
  { name: 'ocak', index: 0 },
  { name: 'şubat', index: 1 },
  { name: 'mart', index: 2 },
  { name: 'nisan', index: 3 },
  { name: 'mayıs', index: 4 },
  { name: 'mayis', index: 4 },
  { name: 'haziran', index: 5 },
  { name: 'temmuz', index: 6 },
  { name: 'ağustos', index: 7 },
  { name: 'agustos', index: 7 },
  { name: 'eylül', index: 8 },
  { name: 'eylul', index: 8 },
  { name: 'ekim', index: 9 },
  { name: 'kasım', index: 10 },
  { name: 'kasim', index: 10 },
  { name: 'aralık', index: 11 },
  { name: 'aralik', index: 11 },
];

const WEEKDAYS: ReadonlyArray<{ readonly iso: number; readonly names: readonly string[] }> = [
  { iso: 1, names: ['pazartesi', 'pzt'] },
  { iso: 2, names: ['sali', 'salı'] },
  { iso: 3, names: ['carsamba', 'çarşamba'] },
  { iso: 4, names: ['persembe', 'perşembe'] },
  { iso: 5, names: ['cuma', 'cum'] },
  { iso: 6, names: ['cumartesi', 'cmt'] },
  { iso: 7, names: ['pazar', 'paz'] },
];

const RELATIVE_DAYS: ReadonlyArray<{ readonly offset: number; readonly words: readonly string[] }> = [
  { offset: 0, words: ['bugun'] },
  { offset: 1, words: ['yarin'] },
  { offset: 2, words: ['obur gun', 'oburgun'] },
  { offset: 7, words: ['onumuzdeki hafta', 'gelecek hafta', 'haftaya'] },
];

const TIME_WORDS: ReadonlyArray<{ readonly hour: number; readonly words: readonly string[] }> = [
  { hour: 7, words: ['sabah'] },
  { hour: 12, words: ['ogle'] },
  { hour: 18, words: ['aksam'] },
  { hour: 23, words: ['gece'] },
];

type Match = {
  readonly start: number;
  readonly end: number;
};

function normalize(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ş', 's')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replaceAll('â', 'a')
    .replaceAll('î', 'i')
    .replaceAll('û', 'u');
}

function collect(re: RegExp, text: string): readonly Match[] {
  const matches: Match[] = [];

  for (const match of text.matchAll(re)) {
    matches.push({ start: match.index, end: match.index + match[0].length });
  }

  return matches;
}

function firstMatchText(text: string, matches: readonly Match[]): string | undefined {
  const first = matches[0];
  return first === undefined ? undefined : text.slice(first.start, first.end);
}

function maskOut(text: string, matches: readonly Match[]): string {
  if (matches.length === 0) {
    return text.trim();
  }

  const masked = new Array(text.length).fill(false);

  for (const match of matches) {
    for (let index = match.start; index < match.end; index += 1) {
      masked[index] = true;
    }
  }

  return [...text]
    .map((char, index) => (masked[index] ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function shiftDate(base: Date, days: number): Date {
  const shifted = new Date(base.getTime());
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function atClockTime(date: Date, hour: number, minute: number): Date {
  const at = new Date(date.getTime());
  at.setHours(hour, minute, 0, 0);
  return at;
}

function nextOccurrenceOfIsoWeekday(base: Date, isoWeekday: number): Date {
  const jsDay = base.getDay();
  const currentIso = jsDay === 0 ? 7 : jsDay;
  const delta = (isoWeekday - currentIso + 7) % 7;
  return shiftDate(base, delta);
}

function dateAtEndOfDay(date: Date): Date {
  return atClockTime(date, 23, 59);
}

export function parseQuickCapture(input: string, now: Date = new Date()): ParsedQuickCapture {
  const original = input.trim();

  if (original.length === 0) {
    return { title: original };
  }

  const norm = normalize(original);
  const matches: Match[] = [];
  const collectAll = (re: RegExp): readonly Match[] => {
    const found = collect(re, norm);
    matches.push(...found);
    return found;
  };

  let priority: ParsedQuickCapture['priority'];
  let recurrence: RecurrenceFormValues | undefined;
  let dayOffset: number | undefined;
  let absoluteDate: Date | undefined;
  let time: { readonly hour: number; readonly minute: number } | undefined;

  if (collectAll(PRIORITY_HIGH).length > 0) {
    priority = 'HIGH';
  }
  if (collectAll(PRIORITY_LOW).length > 0) {
    priority = 'LOW';
  }

  if (collectAll(/\bher gun\b|\bhergun\b/gi).length > 0) {
    recurrence = {
      mode: 'CALENDAR_BASED',
      frequency: 'DAILY',
      interval: 1,
      selectedWeekdays: [],
      dayOfMonth: null,
      monthOfYear: null,
    };
  }

  if (collectAll(/\bher is gunu\b/gi).length > 0) {
    recurrence = {
      mode: 'CALENDAR_BASED',
      frequency: 'WEEKDAYS',
      interval: 1,
      selectedWeekdays: [],
      dayOfMonth: null,
      monthOfYear: null,
    };
  }

  const herWeekdayMatches = collectAll(
    /\bher\s+(pazartesi|pzt|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|cmt|pazar|paz)\b/gi,
  );

  if (herWeekdayMatches.length > 0) {
    const text = firstMatchText(norm, herWeekdayMatches);
    const day = WEEKDAYS.find((candidate) =>
      text !== undefined && candidate.names.some((name) => text.includes(name)),
    );

    if (day) {
      recurrence = {
        mode: 'CALENDAR_BASED',
        frequency: 'WEEKLY',
        interval: 1,
        selectedWeekdays: [day.iso],
        dayOfMonth: null,
        monthOfYear: null,
      };
      absoluteDate = nextOccurrenceOfIsoWeekday(now, day.iso);
    }
  }

  if (collectAll(/\bher hafta\b|\bhaftalik\b/gi).length > 0) {
    const anchor = absoluteDate ?? shiftDate(now, 7);
    const isoWeekday = anchor.getDay() === 0 ? 7 : anchor.getDay();
    recurrence = {
      mode: 'CALENDAR_BASED',
      frequency: 'WEEKLY',
      interval: 1,
      selectedWeekdays: [isoWeekday],
      dayOfMonth: null,
      monthOfYear: null,
    };
    if (absoluteDate === undefined) {
      dayOffset = 7;
    }
  }

  if (collectAll(/\bher ay\b|\baylik\b/gi).length > 0) {
    const anchor = absoluteDate ?? now;
    recurrence = {
      mode: 'CALENDAR_BASED',
      frequency: 'MONTHLY',
      interval: 1,
      selectedWeekdays: [],
      dayOfMonth: anchor.getDate(),
      monthOfYear: null,
    };
    if (absoluteDate === undefined && dayOffset === undefined) {
      absoluteDate = new Date(now.getFullYear(), now.getMonth(), anchor.getDate());
    }
  }

  const herNMatches = collectAll(/\bher\s+(\d+)\s+(?:gunde\s+bir|gun)\b/gi);

  if (herNMatches.length > 0) {
    const text = firstMatchText(norm, herNMatches) ?? '';
    const interval = Number(text.match(/\d+/)?.[0] ?? 1);
    recurrence = {
      mode: 'CALENDAR_BASED',
      frequency: 'DAILY',
      interval,
      selectedWeekdays: [],
      dayOfMonth: null,
      monthOfYear: null,
    };
    dayOffset = 1;
  }

  const monthWords = MONTHS.map((month) => month.name).sort(
    (left, right) => right.length - left.length,
  );
  const monthPattern = new RegExp(
    `\\b(\\d{1,2})\\s+(${monthWords.join('|')})(?:\\s+(\\d{4}))?\\b`,
    'gi',
  );

  for (const match of norm.matchAll(monthPattern)) {
    const [raw, dayText, monthName, yearText] = match;
    const month = MONTHS.find((candidate) => candidate.name === monthName);

    if (month) {
      const year = Number(yearText) || now.getFullYear();
      const candidate = new Date(year, month.index, Number(dayText));
      absoluteDate = candidate >= now ? candidate : new Date(year + 1, month.index, Number(dayText));
    }

    matches.push({ start: match.index, end: match.index + raw.length });
    dayOffset = undefined;
  }

  const timeMatches = collectAll(/\b\d{1,2}:\d{2}\b|\b\d{1,2}\.\d{2}(?!\d)\b/gi);

  for (const match of timeMatches) {
    const text = norm.slice(match.start, match.end);
    const parts = text.includes(':')
      ? text.split(':').map((part) => Number(part))
      : text.split('.').map((part) => Number(part));
    time = { hour: parts[0] ?? 0, minute: parts[1] ?? 0 };
  }

  for (const match of norm.matchAll(/\bsaat\s+(\d{1,2})(?::(\d{2}))?\b/gi)) {
    time = { hour: Number(match[1]), minute: Number(match[2] ?? 0) };
    matches.push({ start: match.index, end: match.index + match[0].length });
  }

  for (const dayWord of TIME_WORDS) {
    const re = new RegExp(
      `\\b(?:${[...dayWord.words].sort((a, b) => b.length - a.length).join('|')})\\s+(\\d{1,2})(?::(\\d{2}))?\\b`,
      'gi',
    );

    for (const match of norm.matchAll(re)) {
      time = { hour: Number(match[1]), minute: Number(match[2] ?? 0) };
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  const relativePattern = new RegExp(
    `\\b(?:${RELATIVE_DAYS.map((group) =>
      [...group.words].sort((a, b) => b.length - a.length).join('|'),
    ).join('|')})\\b(?!\\s+gün)`,
    'gi',
  );

  for (const match of norm.matchAll(relativePattern)) {
    const text = norm.slice(match.index, match.index + match[0].length);
    const group = RELATIVE_DAYS.find((candidate) =>
      candidate.words.some((word) => text.includes(word)),
    );

    if (group) {
      dayOffset = group.offset;
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  for (const match of norm.matchAll(/\b(\d+|bir)\s+(gun|hafta|ay|yil)\s+sonra\b/gi)) {
    const amount = Number(match[1]) || 1;
    const unitDays = { gun: 1, hafta: 7, ay: 30, yil: 365 } as Record<string, number>;
    dayOffset = amount * (unitDays[match[2] ?? ''] ?? 1);
    matches.push({ start: match.index, end: match.index + match[0].length });
  }

  for (const day of WEEKDAYS) {
    if (recurrence?.frequency === 'WEEKLY' && recurrence.selectedWeekdays.includes(day.iso)) {
      continue;
    }

    const re = new RegExp(`\\b(?:${[...day.names].sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi');

    for (const match of norm.matchAll(re)) {
      absoluteDate = nextOccurrenceOfIsoWeekday(now, day.iso);
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  const resolvedDate = absoluteDate ?? (dayOffset === undefined ? now : shiftDate(now, dayOffset));
  let dueAt: Date | undefined;

  if (time !== undefined) {
    const candidate = atClockTime(resolvedDate, time.hour, time.minute);

    if (absoluteDate === undefined && dayOffset === undefined && candidate < now) {
      dueAt = atClockTime(shiftDate(resolvedDate, 1), time.hour, time.minute);
    } else {
      dueAt = candidate;
    }
  } else if (absoluteDate !== undefined || dayOffset !== undefined || recurrence !== undefined) {
    dueAt = dateAtEndOfDay(resolvedDate);
  }

  return {
    title: maskOut(original, matches),
    ...(dueAt !== undefined && { dueAt }),
    ...(priority !== undefined && { priority }),
    ...(recurrence !== undefined && { recurrence }),
  };
}

export function hasQuickCaptureIntent(input: string): boolean {
  return (
    collect(/\b(?:bugun|yarin|obur gun|haftaya|\d+\s+(?:gun|hafta|ay|yil)\s+sonra|pazartesi|pzt|sali|carsamba|persembe|cuma|cumartesi|cmt|pazar|paz|ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik|saat|onemli|her gun|her is gunu)\b/gi, normalize(input)).length > 0
  );
}