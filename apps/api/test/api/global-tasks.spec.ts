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

const TASK_ID = 'b0000000-0000-4000-8000-000000000001';

describe('global task list HTTP contract', () => {
  let app: INestApplication;
  const taskService = {
    getTask: jest.fn<TaskService['getTask']>(),
    editTask: jest.fn<TaskService['editTask']>(),
    listGlobalTasks: jest.fn<TaskService['listGlobalTasks']>(),
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

  describe('GET /tasks', () => {
    it('lists tasks with default parameters', async () => {
      taskService.listGlobalTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        tasks: [
          {
            id: TASK_ID,
            title: 'Test Task',
            priority: 'MEDIUM',
            canonicalStatus: 'TO_DO',
            dueAt: null,
            plannedAt: null,
            lifecycleState: 'ACTIVE',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ title: 'Test Task' });
    });

    it('passes sort and filter parameters', async () => {
      taskService.listGlobalTasks.mockResolvedValue({ outcome: 'SUCCESS', tasks: [] });

      await request(app.getHttpServer())
        .get('/tasks')
        .query({ sort: 'dueDate', order: 'desc', priority: 'HIGH' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(taskService.listGlobalTasks).toHaveBeenCalledWith('user-id', {
        sort: 'dueDate',
        order: 'desc',
        priority: 'HIGH',
        limit: 20,
      });
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/tasks').expect(401);
    });

    it('returns 422 for invalid sort parameter', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .query({ sort: 'invalidField' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });
  });
});
