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

function plannedAt(result: ParsedQuickCapture): Date {
  if (result.plannedAt === undefined) {
    throw new Error('expected plannedAt to be defined');
  }
  return result.plannedAt;
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
    expect(result.plannedAt).toBeDefined();
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59)));
  });

  it('parses "yarın" as end of tomorrow', () => {
    const result = parseQuickCapture('Rapor yarın', NOW);
    expect(result.title).toBe('Rapor');
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 1)));
  });

  it('parses weekday names', () => {
    const result = parseQuickCapture('Toplantı pazartesi', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 2)));
  });

  it('parses relative "gün sonra"', () => {
    const result = parseQuickCapture('Temizlik 3 gün sonra', NOW);
    expect(result.title).toBe('Temizlik');
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 3)));
  });

  it('parses "önümüzdeki hafta"', () => {
    const result = parseQuickCapture('Rapor önümüzdeki hafta', NOW);
    expect(result.title).toBe('Rapor');
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 7)));
  });

  it('parses explicit clock time later today', () => {
    const result = parseQuickCapture('Toplantı saat 18:00', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(plannedAt(result))).toBe(iso(day(18, 0)));
  });

  it('moves past clock time to tomorrow', () => {
    const result = parseQuickCapture('Toplantı saat 14:00', NOW);
    expect(result.title).toBe('Toplantı');
    expect(iso(plannedAt(result))).toBe(iso(day(14, 0, 1)));
  });

  it('parses "akşam 20:30"', () => {
    const result = parseQuickCapture('Yemek akşam 20:30', NOW);
    expect(result.title).toBe('Yemek');
    expect(iso(plannedAt(result))).toBe(iso(day(20, 30)));
  });

  it('parses weekday with time', () => {
    const result = parseQuickCapture('Çağrı cuma 09:30', NOW);
    expect(result.title).toBe('Çağrı');
    expect(iso(plannedAt(result))).toBe(iso(day(9, 30, 6)));
  });

  it('parses priority', () => {
    const result = parseQuickCapture('Rapor önemli', NOW);
    expect(result.title).toBe('Rapor');
    expect(result.priority).toBe('HIGH');
    expect(result.plannedAt).toBeUndefined();
  });

  it('parses absolute month date', () => {
    const result = parseQuickCapture('Randevu 12 ocak', NOW);
    expect(result.title).toBe('Randevu');
    expect(iso(plannedAt(result))).toBe(iso(new Date(2027, 0, 12, 23, 59)));
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
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59)));
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
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 6)));
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
    expect(iso(plannedAt(result))).toBe(iso(day(10, 0, 5)));
  });

  it('parses p1 priority shorthand as HIGH', () => {
    const result = parseQuickCapture('Sunum p1', NOW);
    expect(result.title).toBe('Sunum');
    expect(result.priority).toBe('HIGH');
  });

  it('parses p2 as MEDIUM', () => {
    expect(parseQuickCapture('Sunum p2', NOW).priority).toBe('MEDIUM');
  });

  it('parses p3 as LOW', () => {
    expect(parseQuickCapture('Sunum p3', NOW).priority).toBe('LOW');
  });

  it('combines shorthand, date and priority', () => {
    const result = parseQuickCapture('Sunum p1 cuma 09:30', NOW);
    expect(result.title).toBe('Sunum');
    expect(result.priority).toBe('HIGH');
    expect(iso(plannedAt(result))).toBe(iso(day(9, 30, 6)));
  });

  it('extracts #Project token and keeps the project in the title', () => {
    const result = parseQuickCapture('Rapor #Yazilim', NOW);
    expect(result.title).toBe('Rapor #Yazilim');
    expect(result.projectRaw).toBe('#Yazilim');
  });

  it('extracts @labels and keeps them in the title', () => {
    const result = parseQuickCapture('Rapor @is @odemesi', NOW);
    expect(result.title).toBe('Rapor @is @odemesi');
    expect(result.labelRaws).toEqual(['@is', '@odemesi']);
  });

  it('accepts shorthand tokens with date and priority', () => {
    const result = parseQuickCapture('Rapor #Yazilim @is p1 yarın', NOW);
    expect(result.title).toBe('Rapor #Yazilim @is');
    expect(result.projectRaw).toBe('#Yazilim');
    expect(result.labelRaws).toEqual(['@is']);
    expect(result.priority).toBe('HIGH');
    expect(iso(plannedAt(result))).toBe(iso(day(23, 59, 1)));
  });

  it('does not interpret a #/@-prefixed word as a date keyword', () => {
    const result = parseQuickCapture('Not #pazartesi', NOW);
    expect(result.title).toBe('Not #pazartesi');
    expect(result.projectRaw).toBe('#pazartesi');
    expect(result.plannedAt).toBeUndefined();
  });
});

describe('hasQuickCaptureIntent', () => {
  it('detects date keywords', () => {
    expect(hasQuickCaptureIntent('Bunu yarın yap')).toBe(true);
    expect(hasQuickCaptureIntent('Bunu yap')).toBe(false);
    expect(hasQuickCaptureIntent('Cuma gönder')).toBe(true);
    expect(hasQuickCaptureIntent('Önemli not')).toBe(true);
  });

  it('detects shorthand tokens', () => {
    expect(hasQuickCaptureIntent('Not #proje')).toBe(true);
    expect(hasQuickCaptureIntent('Not @etiket')).toBe(true);
    expect(hasQuickCaptureIntent('Not p3')).toBe(true);
  });
});
