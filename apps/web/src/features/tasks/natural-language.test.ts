import { describe, expect, it } from 'vitest';

import {
  hasQuickCaptureIntent,
  parseQuickCapture,
  type ParsedQuickCapture,
} from './natural-language';

const NOW = new Date(2026, 8, 12, 15, 0, 0, 0);

function iso(date: Date): string {
  return date.toISOString();
}

function day(hour: number, minute: number, offset = 0): Date {
  return new Date(2026, 8, 12 + offset, hour, minute, 0, 0);
}

function dueAt(result: ParsedQuickCapture): Date {
  if (result.dueAt === undefined) {
    throw new Error('expected dueAt to be defined');
  }
  return result.dueAt;
}

describe('parseQuickCapture', () => {
  it('returns empty title for blank input', () => {
    expect(parseQuickCapture('   ', NOW)).toEqual({ title: '' });
  });

  it('keeps plain text as-is', () => {
    expect(parseQuickCapture('Marketten süt al', NOW)).toEqual({ title: 'Marketten süt al' });
  });

  it('parses "bugün" as end of today', () => {
    const result = parseQuickCapture('Bugün rapor teslim', NOW);
    expect(result.title).toBe('rapor teslim');
    expect(result.dueAt).toBeDefined();
    expect(iso(dueAt(result))).toBe(iso(day(23, 59)));
  });

  it('parses "yarın" as end of tomorrow', () => {
    const result = parseQuickCapture('Rapor yarın', NOW);
    expect(result.title).toBe('Rapor');
    expect(iso(dueAt(result))).toBe(iso(day(23, 59, 1)));
  });

  it('parses weekday names', () => {
    const result = parseQuickCapture('Toplantı pazartesi', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(dueAt(result))).toBe(iso(day(23, 59, 2)));
  });

  it('parses relative "gün sonra"', () => {
    const result = parseQuickCapture('Temizlik 3 gün sonra', NOW);
    expect(result.title).toBe('Temizlik');
    expect(iso(dueAt(result))).toBe(iso(day(23, 59, 3)));
  });

  it('parses "önümüzdeki hafta"', () => {
    const result = parseQuickCapture('Rapor önümüzdeki hafta', NOW);
    expect(result.title).toBe('Rapor');
    expect(iso(dueAt(result))).toBe(iso(day(23, 59, 7)));
  });

  it('parses explicit clock time later today', () => {
    const result = parseQuickCapture('Toplantı saat 18:00', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(dueAt(result))).toBe(iso(day(18, 0)));
  });

  it('moves past clock time to tomorrow', () => {
    const result = parseQuickCapture('Toplantı saat 14:00', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(dueAt(result))).toBe(iso(day(14, 0, 1)));
  });

  it('parses "akşam 20:30"', () => {
    const result = parseQuickCapture('Yemek akşam 20:30', NOW);
    expect(result.title).toBe('Yemek');
    expect(iso(dueAt(result))).toBe(iso(day(20, 30)));
  });

  it('parses weekday with time', () => {
    const result = parseQuickCapture('Çağrı cuma 09:30', NOW);
    expect(result.title).toBe('Çağrı');
    expect(iso(dueAt(result))).toBe(iso(day(9, 30, 6)));
  });

  it('parses priority', () => {
    const result = parseQuickCapture('Rapor önemli', NOW);
    expect(result.title).toBe('Rapor');
    expect(result.priority).toBe('HIGH');
    expect(result.dueAt).toBeUndefined();
  });

  it('parses absolute month date', () => {
    const result = parseQuickCapture('Randevu 12 ocak', NOW);
    expect(result.title).toBe('Randevu');
    expect(iso(dueAt(result))).toBe(iso(new Date(2027, 0, 12, 23, 59)));
  });

  it('parses "her gün" recurrence', () => {
    const result = parseQuickCapture('Spor her gün', NOW);
    expect(result.title).toBe('Spor');
    expect(result.recurrence).toEqual({
      mode: 'CALENDAR_BASED',
      frequency: 'DAILY',
      interval: 1,
      selectedWeekdays: [],
      dayOfMonth: null,
      monthOfYear: null,
    });
    expect(iso(dueAt(result))).toBe(iso(day(23, 59)));
  });

  it('parses "her iş günü" recurrence', () => {
    const result = parseQuickCapture('Meditasyon her iş günü', NOW);
    expect(result.recurrence?.frequency).toBe('WEEKDAYS');
  });

  it('parses "her cuma" recurrence with next friday anchor', () => {
    const result = parseQuickCapture('Tatil her cuma', NOW);
    expect(result.title).toBe('Tatil');
    expect(result.recurrence?.frequency).toBe('WEEKLY');
    expect(result.recurrence?.selectedWeekdays).toEqual([5]);
    expect(iso(dueAt(result))).toBe(iso(day(23, 59, 6)));
  });

  it('parses "her 3 günde bir" recurrence interval', () => {
    const result = parseQuickCapture('Su iç her 3 günde bir', NOW);
    expect(result.title).toBe('Su iç');
    expect(result.recurrence?.frequency).toBe('DAILY');
    expect(result.recurrence?.interval).toBe(3);
  });

  it('combines priority, weekday and time', () => {
    const result = parseQuickCapture('Sunum önemli perşembe 10:00', NOW);
    expect(result.title).toBe('Sunum');
    expect(result.priority).toBe('HIGH');
    expect(iso(dueAt(result))).toBe(iso(day(10, 0, 5)));
  });
});

describe('hasQuickCaptureIntent', () => {
  it('detects date keywords', () => {
    expect(hasQuickCaptureIntent('Bunu yarın yap')).toBe(true);
    expect(hasQuickCaptureIntent('Bunu yap')).toBe(false);
    expect(hasQuickCaptureIntent('Cuma gönder')).toBe(true);
    expect(hasQuickCaptureIntent('Önemli not')).toBe(true);
  });
});