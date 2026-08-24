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

describe('kanban HTTP contract', () => {
  const TASK_ID = 'b0000000-0000-4000-8000-000000000001';

  let app: INestApplication;
  const taskService = {
    getTask: jest.fn<TaskService['getTask']>(),
    editTask: jest.fn<TaskService['editTask']>(),
    listGlobalTasks: jest.fn<TaskService['listGlobalTasks']>(),
    listTodayTasks: jest.fn<TaskService['listTodayTasks']>(),
    listKanbanTasks: jest.fn<TaskService['listKanbanTasks']>(),
    moveKanbanTask: jest.fn<TaskService['moveKanbanTask']>(),
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

  describe('GET /tasks/kanban', () => {
    it('returns three canonical groups', async () => {
      taskService.listKanbanTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        todo: [],
        inProgress: [],
        completed: [],
      });

      const response = await request(app.getHttpServer())
        .get('/tasks/kanban')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body).toHaveProperty('todo');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('completed');
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/tasks/kanban').expect(401);
    });
  });

  describe('POST /tasks/kanban-moves', () => {
    it('moves a task between groups', async () => {
      taskService.moveKanbanTask.mockResolvedValue({
        outcome: 'SUCCESS',
        task: {
          id: TASK_ID,
          areaId: 'a0000000-0000-4000-8000-000000000002',
          userId: 'user-id',
          title: 'Task',
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'MEDIUM',
          areaStatusId: 'status-2',
          globalRank: '001',
          areaRank: '001',
          lifecycleState: 'ACTIVE',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: null,
          completedAt: null,
        },
        etag: 2,
      });

      const response = await request(app.getHttpServer())
        .post('/tasks/kanban-moves')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ taskId: TASK_ID, targetCanonicalStatus: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.data.id).toBe(TASK_ID);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/tasks/kanban-moves')
        .set('Content-Type', 'application/json')
        .send({ taskId: TASK_ID, targetCanonicalStatus: 'IN_PROGRESS' })
        .expect(401);
    });
  });
});
