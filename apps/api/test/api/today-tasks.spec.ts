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

describe('today task list HTTP contract', () => {
  let app: INestApplication;
  const taskService = {
    getTask: jest.fn<TaskService['getTask']>(),
    editTask: jest.fn<TaskService['editTask']>(),
    listGlobalTasks: jest.fn<TaskService['listGlobalTasks']>(),
    listTodayTasks: jest.fn<TaskService['listTodayTasks']>(),
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

  describe('GET /tasks/today', () => {
    it('returns today sections with default timezone', async () => {
      taskService.listTodayTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        today: '2026-08-21',
        timezone: 'Europe/Istanbul',
        overdue: [],
        plannedToday: [],
        dueToday: [],
        completedToday: [],
      });

      const response = await request(app.getHttpServer())
        .get('/tasks/today')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.today).toBe('2026-08-21');
      expect(response.body.overdue.count).toBe(0);
      expect(response.body.plannedToday.count).toBe(0);
    });

    it('passes timezone parameter', async () => {
      taskService.listTodayTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        today: '2026-08-21',
        timezone: 'America/New_York',
        overdue: [],
        plannedToday: [],
        dueToday: [],
        completedToday: [],
      });

      await request(app.getHttpServer())
        .get('/tasks/today')
        .query({ timezone: 'America/New_York' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(taskService.listTodayTasks).toHaveBeenCalledWith('user-id', {
        timezone: 'America/New_York',
      });
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/tasks/today').expect(401);
    });
  });
});
