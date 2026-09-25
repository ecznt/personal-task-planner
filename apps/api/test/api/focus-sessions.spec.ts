import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { FocusSessionService } from '../../src/modules/planning/application/focus-session.service';
import { FocusSessionController } from '../../src/modules/planning/transport/focus-session.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('focus session HTTP contract', () => {
  let app: INestApplication;
  const focusSessionService = {
    recordFocusSession: jest.fn<FocusSessionService['recordFocusSession']>(),
    listFocusSessions: jest.fn<FocusSessionService['listFocusSessions']>(),
    getFocusStatistics: jest.fn<FocusSessionService['getFocusStatistics']>(),
  };
  const accountsRepository = {
    findAuthenticatedSession: jest
      .fn<AccountsRepository['findAuthenticatedSession']>()
      .mockResolvedValue({ userId: 'user-id' } as never),
  };
  const authSecurityService = {
    hashSecret: jest.fn<AuthSecurityService['hashSecret']>().mockReturnValue('hashed-token'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FocusSessionController],
      providers: [
        { provide: FocusSessionService, useValue: focusSessionService },
        { provide: AccountsRepository, useValue: accountsRepository },
        { provide: AuthSecurityService, useValue: authSecurityService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    accountsRepository.findAuthenticatedSession.mockResolvedValue({ userId: 'user-id' } as never);
    authSecurityService.hashSecret.mockReturnValue('hashed-token');
  });

  describe('POST /focus-sessions', () => {
    it('records a completed focus session', async () => {
      focusSessionService.recordFocusSession.mockResolvedValue({
        outcome: 'SUCCESS',
        created: true,
        etag: 1,
        session: {
          id: 'a0000000-0000-4000-8000-000000000001',
          userId: 'user-id',
          startedAt: new Date('2026-09-25T08:00:00.000Z'),
          completedAt: new Date('2026-09-25T08:25:00.000Z'),
          durationMinutes: 25,
          clientKey: 'client-key-1',
          createdAt: new Date('2026-09-25T08:25:00.000Z'),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({
          startedAt: '2026-09-25T08:00:00.000Z',
          completedAt: '2026-09-25T08:25:00.000Z',
          durationMinutes: 25,
          clientKey: 'client-key-1',
        })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: 'a0000000-0000-4000-8000-000000000001',
        durationMinutes: 25,
      });
      expect(response.headers.location).toBe('/api/v1/focus-sessions/a0000000-0000-4000-8000-000000000001');
    });

    it('returns 200 when the session is a replay', async () => {
      focusSessionService.recordFocusSession.mockResolvedValue({
        outcome: 'SUCCESS',
        created: false,
        etag: 1,
        session: {
          id: 'a0000000-0000-4000-8000-000000000001',
          userId: 'user-id',
          startedAt: new Date('2026-09-25T08:00:00.000Z'),
          completedAt: new Date('2026-09-25T08:25:00.000Z'),
          durationMinutes: 25,
          clientKey: 'client-key-1',
          createdAt: new Date('2026-09-25T08:25:00.000Z'),
        },
      });

      await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({
          startedAt: '2026-09-25T08:00:00.000Z',
          completedAt: '2026-09-25T08:25:00.000Z',
          durationMinutes: 25,
          clientKey: 'client-key-1',
        })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(200);
    });

    it('requires Idempotency-Key', async () => {
      await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({
          startedAt: '2026-09-25T08:00:00.000Z',
          completedAt: '2026-09-25T08:25:00.000Z',
          durationMinutes: 25,
          clientKey: 'client-key-1',
        })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('returns 422 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({ durationMinutes: 25, clientKey: 'client-key-1' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });

    it('returns 422 for service validation errors', async () => {
      focusSessionService.recordFocusSession.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Odak süresi 5 ile 240 dakika arasında olmalıdır.',
      });

      await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({
          startedAt: '2026-09-25T08:00:00.000Z',
          completedAt: '2026-09-25T08:25:00.000Z',
          durationMinutes: 25,
          clientKey: 'client-key-1',
        })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/focus-sessions')
        .send({
          startedAt: '2026-09-25T08:00:00.000Z',
          completedAt: '2026-09-25T08:25:00.000Z',
          durationMinutes: 25,
          clientKey: 'client-key-1',
        })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(401);
    });
  });

  describe('GET /focus-sessions', () => {
    it('lists sessions for the authenticated user', async () => {
      focusSessionService.listFocusSessions.mockResolvedValue({
        outcome: 'SUCCESS',
        sessions: [
          {
            id: 'a0000000-0000-4000-8000-000000000001',
            userId: 'user-id',
            startedAt: new Date('2026-09-25T08:00:00.000Z'),
            completedAt: new Date('2026-09-25T08:25:00.000Z'),
            durationMinutes: 25,
            clientKey: 'client-key-1',
            createdAt: new Date('2026-09-25T08:25:00.000Z'),
          },
        ],
        nextCursor: 'cursor-1',
      });

      const response = await request(app.getHttpServer())
        .get('/focus-sessions?limit=10')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toEqual([
        expect.objectContaining({ id: 'a0000000-0000-4000-8000-000000000001', durationMinutes: 25 }),
      ]);
      expect(response.body.meta.nextCursor).toBe('cursor-1');
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/focus-sessions').expect(401);
    });
  });

  describe('GET /focus-sessions/statistics', () => {
    it('returns statistics for the authenticated user', async () => {
      focusSessionService.getFocusStatistics.mockResolvedValue({
        outcome: 'SUCCESS',
        statistics: {
          timezone: 'Europe/Istanbul',
          totalSessions: 12,
          totalMinutes: 300,
          todaySessions: 2,
          todayMinutes: 50,
          currentStreak: 3,
          bestStreak: 7,
          days: [
            { date: '2026-09-19', minutes: 0, sessions: 0 },
            { date: '2026-09-20', minutes: 25, sessions: 1 },
            { date: '2026-09-21', minutes: 0, sessions: 0 },
            { date: '2026-09-22', minutes: 50, sessions: 2 },
            { date: '2026-09-23', minutes: 0, sessions: 0 },
            { date: '2026-09-24', minutes: 25, sessions: 1 },
            { date: '2026-09-25', minutes: 50, sessions: 2 },
          ],
        },
      });

      const response = await request(app.getHttpServer())
        .get('/focus-sessions/statistics?timezone=Europe/Istanbul')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toMatchObject({
        totalSessions: 12,
        totalMinutes: 300,
        todayMinutes: 50,
        currentStreak: 3,
        bestStreak: 7,
      });
      expect(response.body.data.days).toHaveLength(7);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/focus-sessions/statistics').expect(401);
    });
  });
});