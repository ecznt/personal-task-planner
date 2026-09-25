import { describe, expect, it } from '@jest/globals';

import { computeStreaks } from '../../src/modules/planning/application/focus-streak';

describe('computeStreaks', () => {
  it('counts current streak ending today', () => {
    const active = new Set(['2026-09-23', '2026-09-24', '2026-09-25']);

    expect(computeStreaks(active, '2026-09-25')).toEqual({ current: 3, best: 3 });
  });

  it('does not break streak when today is inactive but yesterday is active', () => {
    const active = new Set(['2026-09-24', '2026-09-25']);

    expect(computeStreaks(active, '2026-09-26')).toEqual({ current: 2, best: 2 });
  });

  it('resets current streak when neither today nor yesterday is active', () => {
    const active = new Set(['2026-09-22', '2026-09-23']);

    expect(computeStreaks(active, '2026-09-26')).toEqual({ current: 0, best: 2 });
  });

  it('computes best streak across gaps', () => {
    const active = new Set([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
    ]);

    expect(computeStreaks(active, '2026-09-18')).toEqual({ current: 4, best: 4 });
  });

  it('isolates best from current when a newer shorter run exists', () => {
    const active = new Set(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-24']);

    expect(computeStreaks(active, '2026-09-25')).toEqual({ current: 1, best: 5 });
  });

  it('handles empty active dates', () => {
    expect(computeStreaks(new Set(), '2026-09-25')).toEqual({ current: 0, best: 0 });
  });
});