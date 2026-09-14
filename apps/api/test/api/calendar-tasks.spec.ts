import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { TaskService } from '../../src/modules/planning/application/task.service';
import { TaskController } from '../../src/modules/planning/transport/task.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('calendar task list HTTP contract', () => {
  let app: INestApplication;
  const taskService = {
    listCalendarTasks: jest.fn<TaskService['listCalendarTasks']>(),
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
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: taskService },
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

  describe('GET /tasks/calendar', () => {
    it('returns day-grouped tasks for an explicit range', async () => {
      taskService.listCalendarTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        timezone: 'Europe/Istanbul',
        days: [
          {
            date: '2026-09-14',
            planned: [makeSummary('task-1', 'Planned task')],
            due: [],
          },
          {
            date: '2026-09-15',
            planned: [],
            due: [makeSummary('task-2', 'Due task')],
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: '2026-09-14', end: '2026-09-15' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.timezone).toBe('Europe/Istanbul');
      expect(response.body.days).toHaveLength(2);
      expect(response.body.days[0].date).toBe('2026-09-14');
      expect(response.body.days[0].planned[0].title).toBe('Planned task');
      expect(response.body.days[1].date).toBe('2026-09-15');
      expect(response.body.days[1].due[0].title).toBe('Due task');
      expect(response.body.days[0].planned[0]).toEqual(
        expect.objectContaining({ id: 'task-1', priority: 'MEDIUM' }),
      );
    });

    it('passes timezone, start, and end to the service', async () => {
      taskService.listCalendarTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        timezone: 'Europe/Istanbul',
        days: [],
      });

      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: '2026-09-14', end: '2026-10-11' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(taskService.listCalendarTasks).toHaveBeenCalledWith('user-id', {
        timezone: 'Europe/Istanbul',
        start: '2026-09-14',
        end: '2026-10-11',
      });
    });

    it('rejects an end date before the start date', async () => {
      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: '2026-09-15', end: '2026-09-14' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('rejects a range longer than 62 days', async () => {
      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: '2026-01-01', end: '2026-04-01' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('rejects a malformed date', async () => {
      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: 'not-a-date', end: '2026-09-15' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('requires start and end', async () => {
      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/tasks/calendar')
        .query({ timezone: 'Europe/Istanbul', start: '2026-09-14', end: '2026-09-15' })
        .expect(401);
    });
  });
});

function makeSummary(id: string, title: string) {
  return {
    id,
    title,
    priority: 'MEDIUM',
    canonicalStatus: 'TO_DO',
    dueAt: null,
    plannedAt: null,
    lifecycleState: 'ACTIVE',
    version: 1,
    areaId: 'area-id',
  } as const;
}
