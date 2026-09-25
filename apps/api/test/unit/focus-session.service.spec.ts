import { describe, expect, it, jest } from '@jest/globals';

import { FocusSessionService } from '../../src/modules/planning/application/focus-session.service';
import type { FocusSessionRepository } from '../../src/modules/planning/infrastructure/focus-session.repository';
import type { FocusSession } from '../../src/modules/planning/domain/focus-session.entity';

const SESSION: FocusSession = {
  id: 'focus-session-1',
  userId: 'user-id',
  startedAt: new Date('2026-09-25T08:00:00.000Z'),
  completedAt: new Date('2026-09-25T08:25:00.000Z'),
  durationMinutes: 25,
  clientKey: 'client-key-1',
  createdAt: new Date('2026-09-25T08:25:00.000Z'),
};

const repositoryMock = (): FocusSessionRepository =>
  ({
    create: jest.fn(async () => SESSION),
    findByClientKey: jest.fn(async () => null),
    list: jest.fn(async () => ({ sessions: [SESSION] })),
    findAll: jest.fn(async () => []),
    findCompletedBetween: jest.fn(async () => []),
  }) as unknown as FocusSessionRepository;

const serviceMock = (repository: FocusSessionRepository): FocusSessionService =>
  new FocusSessionService(repository);

describe('focus session service — recordFocusSession', () => {
  it('records a session from a command', async () => {
    const repository = repositoryMock();
    const service = serviceMock(repository);

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:00:00.000Z',
      completedAt: '2026-09-25T08:25:00.000Z',
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.created).toBe(true);
      expect(result.session.id).toBe('focus-session-1');
      expect(result.etag).toBe(1);
    }
    expect(repository.create).toHaveBeenCalledWith('user-id', {
      startedAt: new Date('2026-09-25T08:00:00.000Z'),
      completedAt: new Date('2026-09-25T08:25:00.000Z'),
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });
  });

  it('returns the existing session when clientKey is duplicated', async () => {
    const repository = repositoryMock();
    jest
      .mocked(repository.create)
      .mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));
    jest.mocked(repository.findByClientKey).mockResolvedValue(SESSION);
    const service = serviceMock(repository);

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:00:00.000Z',
      completedAt: '2026-09-25T08:25:00.000Z',
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.created).toBe(false);
      expect(result.session.id).toBe('focus-session-1');
    }
  });

  it('rethrows non-unique errors', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.create).mockRejectedValue(new Error('boom'));
    const service = serviceMock(repository);

    await expect(
      service.recordFocusSession('user-id', {
        startedAt: '2026-09-25T08:00:00.000Z',
        completedAt: '2026-09-25T08:25:00.000Z',
        durationMinutes: 25,
        clientKey: 'client-key-1',
      }),
    ).rejects.toThrow('boom');
  });

  it('rejects an empty clientKey', async () => {
    const service = serviceMock(repositoryMock());

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:00:00.000Z',
      completedAt: '2026-09-25T08:25:00.000Z',
      durationMinutes: 25,
      clientKey: '   ',
    });

    expect(result).toEqual({ outcome: 'VALIDATION_ERROR', detail: 'Odak seans anahtarı boş olamaz.' });
  });

  it('rejects a duration below the minimum', async () => {
    const service = serviceMock(repositoryMock());

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:00:00.000Z',
      completedAt: '2026-09-25T08:04:00.000Z',
      durationMinutes: 4,
      clientKey: 'client-key-1',
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });

  it('rejects completion before start', async () => {
    const service = serviceMock(repositoryMock());

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:25:00.000Z',
      completedAt: '2026-09-25T08:00:00.000Z',
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Odak seans bitişi başlangıcından önce olamaz.',
    });
  });

  it('rejects completion far in the future', async () => {
    const service = serviceMock(repositoryMock());
    const farFuture = new Date(Date.now() + 60 * 60 * 1_000);

    const result = await service.recordFocusSession('user-id', {
      startedAt: '2026-09-25T08:00:00.000Z',
      completedAt: farFuture.toISOString(),
      durationMinutes: 25,
      clientKey: 'client-key-1',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Odak seans bitişi gelecekte olamaz.',
    });
  });
});

describe('focus session service — listFocusSessions', () => {
  it('returns sessions and pagination', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.list).mockResolvedValue({ sessions: [SESSION], nextCursor: 'cursor-2' });
    const service = serviceMock(repository);

    const result = await service.listFocusSessions('user-id', { limit: 20 });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.sessions).toEqual([SESSION]);
      expect(result.nextCursor).toBe('cursor-2');
    }
  });
});

describe('focus session service — getFocusStatistics', () => {
  it('computes totals, streaks and weekly buckets', async () => {
    const repository = repositoryMock();
    const now = Date.now();
    const todayMorning = new Date(now);
    todayMorning.setUTCHours(8, 25, 0, 0);
    const todayNoon = new Date(now);
    todayNoon.setUTCHours(12, 0, 0, 0);
    const yesterdayMorning = new Date(now - 86_400_000);
    yesterdayMorning.setUTCHours(10, 0, 0, 0);

    jest.mocked(repository.findAll).mockResolvedValue([
      { ...SESSION, completedAt: todayMorning, durationMinutes: 25 },
      { ...SESSION, id: 's2', completedAt: todayNoon, durationMinutes: 50 },
      { ...SESSION, id: 's3', completedAt: yesterdayMorning, durationMinutes: 15 },
    ]);
    const service = serviceMock(repository);

    const result = await service.getFocusStatistics('user-id', 'UTC');

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.statistics.totalSessions).toBe(3);
      expect(result.statistics.totalMinutes).toBe(90);
      expect(result.statistics.todaySessions).toBe(2);
      expect(result.statistics.todayMinutes).toBe(75);
      expect(result.statistics.currentStreak).toBeGreaterThanOrEqual(2);
      expect(result.statistics.days).toHaveLength(7);
      expect(result.statistics.days[6]).toEqual({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        minutes: 75,
        sessions: 2,
      });
    }
  });
});