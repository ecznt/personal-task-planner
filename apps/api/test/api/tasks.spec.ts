import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { AreaService } from '../../src/modules/planning/application/area.service';
import { TaskService } from '../../src/modules/planning/application/task.service';
import { AreaController } from '../../src/modules/planning/transport/area.controller';
import { TaskController } from '../../src/modules/planning/transport/task.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('task HTTP contract', () => {
  let app: INestApplication;
  const areaService = {
    createArea: jest.fn<AreaService['createArea']>(),
    getArea: jest.fn<AreaService['getArea']>(),
    listAreas: jest.fn<AreaService['listAreas']>(),
    renameArea: jest.fn<AreaService['renameArea']>(),
  };
  const taskService = {
    createTask: jest.fn<TaskService['createTask']>(),
    getTask: jest.fn<TaskService['getTask']>(),
    listTasks: jest.fn<TaskService['listTasks']>(),
    editTask: jest.fn<TaskService['editTask']>(),
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
      controllers: [AreaController, TaskController],
      providers: [
        { provide: AreaService, useValue: areaService },
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

  describe('POST /areas/:areaId/tasks', () => {
    it('creates a task with valid input', async () => {
      taskService.createTask.mockResolvedValue({
        outcome: 'SUCCESS',
        task: {
          id: 'task-id',
          userId: 'user-id',
          areaId: 'area-id',
          projectId: null,
          areaStatusId: 'status-id',
          title: 'Test Task',
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'MEDIUM',
          completedAt: null,
          lifecycleState: 'ACTIVE',
          globalRank: '000000000000000000000001',
          areaRank: '000000000000000000000001',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          recurrenceSeriesId: null,
          recurrenceRuleVersionId: null,
          occurrenceNumber: null,
          predecessorTaskId: null,
          generationKey: null,
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/areas/area-id/tasks')
        .send({ title: 'Test Task', priority: 'MEDIUM' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: 'task-id',
        title: 'Test Task',
      });
      expect(response.headers.etag).toBe('1');
    });

    it('returns 404 for non-existent area', async () => {
      taskService.createTask.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .post('/areas/non-existent/tasks')
        .send({ title: 'Test Task' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(404);
    });

    it('returns 422 for blank title', async () => {
      taskService.createTask.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Görev başlığı boş olamaz.',
      });

      await request(app.getHttpServer())
        .post('/areas/area-id/tasks')
        .send({ title: '' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });
  });

  describe('GET /areas/:areaId/tasks', () => {
    it('lists tasks for an area', async () => {
      taskService.listTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        tasks: [
          {
            id: 'task-id',
            title: 'Test Task',
            priority: 'MEDIUM',
            canonicalStatus: 'TO_DO',
            dueAt: null,
            plannedAt: null,
            lifecycleState: 'ACTIVE',
            version: 1,
            areaId: 'area-id',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/areas/area-id/tasks')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ title: 'Test Task' });
    });

    it('returns 404 for non-existent area', async () => {
      taskService.listTasks.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .get('/areas/non-existent/tasks')
        .set('Cookie', 'planner-session=token')
        .expect(404);
    });
  });

  describe('GET /tasks/:taskId', () => {
    it('returns task detail', async () => {
      taskService.getTask.mockResolvedValue({
        outcome: 'SUCCESS',
        data: {
          task: {
            id: 'task-id',
            userId: 'user-id',
            areaId: 'area-id',
            projectId: null,
            areaStatusId: 'status-id',
            title: 'Test Task',
            description: 'Description',
            plannedAt: null,
            dueAt: null,
            priority: 'HIGH',
            completedAt: null,
            lifecycleState: 'ACTIVE',
            globalRank: '000000000000000000000001',
            areaRank: '000000000000000000000001',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            recurrenceSeriesId: null,
            recurrenceRuleVersionId: null,
            occurrenceNumber: null,
            predecessorTaskId: null,
            generationKey: null,
          },
          canonicalStatus: 'TO_DO',
          areaName: 'Test Area',
          labels: [],
          checklistItems: [],
          recurrence: null,
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/tasks/task-id')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 'task-id',
        title: 'Test Task',
        canonicalStatus: 'TO_DO',
      });
      expect(response.headers.etag).toBe('1');
    });

    it('returns 404 for non-existent task', async () => {
      taskService.getTask.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .get('/tasks/non-existent')
        .set('Cookie', 'planner-session=token')
        .expect(404);
    });
  });

  describe('PATCH /tasks/:taskId', () => {
    it('edits task with valid input', async () => {
      taskService.editTask.mockResolvedValue({
        outcome: 'SUCCESS',
        task: {
          id: 'task-id',
          userId: 'user-id',
          areaId: 'area-id',
          projectId: null,
          areaStatusId: 'status-id',
          title: 'Updated Title',
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'HIGH',
          completedAt: null,
          lifecycleState: 'ACTIVE',
          globalRank: '000000000000000000000001',
          areaRank: '000000000000000000000001',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          recurrenceSeriesId: null,
          recurrenceRuleVersionId: null,
          occurrenceNumber: null,
          predecessorTaskId: null,
          generationKey: null,
        },
        etag: 2,
        canonicalStatus: 'TO_DO',
      });

      const response = await request(app.getHttpServer())
        .patch('/tasks/task-id')
        .send({ title: 'Updated Title', priority: 'HIGH' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 'task-id',
        title: 'Updated Title',
        version: 2,
      });
      expect(response.headers.etag).toBe('2');
    });

    it('returns 409 for stale version', async () => {
      taskService.editTask.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .patch('/tasks/task-id')
        .send({ title: 'Updated Title' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(409);
    });

    it('returns 404 for non-existent task', async () => {
      taskService.editTask.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .patch('/tasks/non-existent')
        .send({ title: 'Updated Title' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(404);
    });

    it('returns 422 when If-Match header is missing', async () => {
      await request(app.getHttpServer())
        .patch('/tasks/task-id')
        .send({ title: 'Updated Title' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });
  });
});
