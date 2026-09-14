import { describe, expect, it } from '@jest/globals';

import { buildReminderBody, buildReminderTitle } from '../../src/modules/planning/application/reminder-message';

describe('reminder message copy', () => {
  it('builds a title from the task', () => {
    expect(buildReminderTitle('Diş hekimi randevusu')).toBe('Hatırlatma: Diş hekimi randevusu');
  });

  it('builds a due-at body using the task time and user time zone', () => {
    const body = buildReminderBody(
      {
        anchorInstant: new Date('2026-09-13T10:30:00.000Z'),
        anchorType: 'DUE',
        taskTitle: 'Diş hekimi randevusu',
      },
      'Europe/Istanbul',
    );

    expect(body).toBe('Bitiş: 13 Eyl 13:30');
  });

  it('builds a planned-at body with the anchor label', () => {
    const body = buildReminderBody(
      {
        anchorInstant: new Date('2026-09-13T07:00:00.000Z'),
        anchorType: 'PLANNED',
        taskTitle: 'Sunum hazırlığı',
      },
      'UTC',
    );

    expect(body).toBe('Planlanan: 13 Eyl 07:00');
  });
});