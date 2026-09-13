import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { AreaService } from '../../src/modules/planning/application/area.service';
import { TaskService } from '../../src/modules/planning/application/task.service';
import { AreaController } from '../../src/modules/planning/transport/area.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('area HTTP contract', () => {
  const TASK_ID = 'b0000000-0000-4000-8000-000000000001';
  const STATUS_ID = 'b0000000-0000-4000-8000-000000000002';

  let app: INestApplication;
  const areaService = {
    createArea: jest.fn<AreaService['createArea']>(),
    getArea: jest.fn<AreaService['getArea']>(),
    listAreas: jest.fn<AreaService['listAreas']>(),
    renameArea: jest.fn<AreaService['renameArea']>(),
    createAreaStatus: jest.fn<AreaService['createAreaStatus']>(),
    updateAreaStatusName: jest.fn<AreaService['updateAreaStatusName']>(),
    retireAreaStatus: jest.fn<AreaService['retireAreaStatus']>(),
    activateAreaStatus: jest.fn<AreaService['activateAreaStatus']>(),
    reorderAreaStatuses: jest.fn<AreaService['reorderAreaStatuses']>(),
  };
  const taskService = {
    createTask: jest.fn<TaskService['createTask']>(),
    getTask: jest.fn<TaskService['getTask']>(),
    listTasks: jest.fn<TaskService['listTasks']>(),
    editTask: jest.fn<TaskService['editTask']>(),
    listAreaKanbanTasks: jest.fn<TaskService['listAreaKanbanTasks']>(),
    moveAreaKanbanTask: jest.fn<TaskService['moveAreaKanbanTask']>(),
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
      controllers: [AreaController],
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

  describe('POST /areas', () => {
    it('creates an area with valid input', async () => {
      areaService.createArea.mockResolvedValue({
        outcome: 'SUCCESS',
        area: {
          id: 'area-id',
          userId: 'user-id',
          name: 'Test Area',
          normalizedName: 'test area',
          isInbox: false,
          lifecycleState: 'ACTIVE',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        statuses: [
          {
            id: 'status-1',
            userId: 'user-id',
            areaId: 'area-id',
            name: 'Yapılacak',
            normalizedName: 'yapilacak',
            canonicalStatus: 'TO_DO',
            position: 1,
            isDefault: true,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/areas')
        .send({ name: 'Test Area' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: 'area-id',
        name: 'Test Area',
      });
    });

    it('returns 422 for invalid input', async () => {
      areaService.createArea.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Alan adı boş olamaz.',
      });

      await request(app.getHttpServer())
        .post('/areas')
        .send({ name: '' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });
  });

  describe('GET /areas', () => {
    it('lists areas for authenticated user', async () => {
      areaService.listAreas.mockResolvedValue({
        outcome: 'SUCCESS',
        areas: [
          {
            id: 'area-id',
            name: 'Test Area',
            isInbox: false,
            lifecycleState: 'ACTIVE',
            taskCount: 5,
            projectCount: 1,
            overdueTaskCount: 0,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/areas')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ name: 'Test Area' });
    });
  });

  describe('GET /areas/:areaId', () => {
    it('returns area detail for existing area', async () => {
      areaService.getArea.mockResolvedValue({
        outcome: 'SUCCESS',
        data: {
          area: {
            id: 'area-id',
            userId: 'user-id',
            name: 'Test Area',
            normalizedName: 'test area',
            isInbox: false,
            lifecycleState: 'ACTIVE',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          statuses: [],
          taskCount: 5,
          projectCount: 2,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/areas/area-id')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 'area-id',
        name: 'Test Area',
        taskCount: 5,
        projectCount: 2,
      });
    });

    it('returns 404 for non-existent area', async () => {
      areaService.getArea.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .get('/areas/non-existent')
        .set('Cookie', 'planner-session=token')
        .expect(404);
    });
  });

  describe('PATCH /areas/:areaId', () => {
    it('renames area with valid input', async () => {
      areaService.renameArea.mockResolvedValue({
        outcome: 'SUCCESS',
        area: {
          id: 'area-id',
          userId: 'user-id',
          name: 'New Name',
          normalizedName: 'new name',
          isInbox: false,
          lifecycleState: 'ACTIVE',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .patch('/areas/area-id')
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 'area-id',
        name: 'New Name',
        version: 2,
      });
    });

    it('returns 409 for stale version', async () => {
      areaService.renameArea.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .patch('/areas/area-id')
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(409);
    });

    it('returns 404 for non-existent area', async () => {
      areaService.renameArea.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .patch('/areas/non-existent')
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(404);
    });
  });

  describe('GET /areas/:areaId/kanban', () => {
    it('returns area kanban columns', async () => {
      taskService.listAreaKanbanTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        statuses: [{ id: 'status-1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 }],
        columns: [{ statusId: 'status-1', count: 0, tasks: [] }],
      });

      const response = await request(app.getHttpServer())
        .get('/areas/area-id/kanban')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body).toHaveProperty('statuses');
      expect(response.body).toHaveProperty('columns');
      expect(response.body.statuses).toHaveLength(1);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/areas/area-id/kanban').expect(401);
    });

    it('returns 404 for non-existent area', async () => {
      taskService.listAreaKanbanTasks.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .get('/areas/non-existent/kanban')
        .set('Cookie', 'planner-session=token')
        .expect(404);
    });
  });

  describe('POST /areas/:areaId/kanban-moves', () => {
    it('moves task between area columns', async () => {
      taskService.moveAreaKanbanTask.mockResolvedValue({
        outcome: 'SUCCESS',
        task: {
          id: TASK_ID,
          areaId: 'area-id',
          userId: 'user-id',
          title: 'Task',
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'MEDIUM',
          areaStatusId: STATUS_ID,
          globalRank: '001',
          areaRank: '001',
          lifecycleState: 'ACTIVE',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: null,
          completedAt: null,
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
        .post('/areas/area-id/kanban-moves')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ taskId: TASK_ID, targetAreaStatusId: STATUS_ID })
        .expect(200);

      expect(response.body.data.id).toBe(TASK_ID);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/areas/area-id/kanban-moves')
        .set('Content-Type', 'application/json')
        .send({ taskId: TASK_ID, targetAreaStatusId: STATUS_ID })
        .expect(401);
    });

    it('returns 422 without If-Match header', async () => {
      await request(app.getHttpServer())
        .post('/areas/area-id/kanban-moves')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .send({ taskId: TASK_ID, targetAreaStatusId: STATUS_ID })
        .expect(422);
    });

    it('returns 409 for stale version', async () => {
      taskService.moveAreaKanbanTask.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .post('/areas/area-id/kanban-moves')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ taskId: TASK_ID, targetAreaStatusId: STATUS_ID })
        .expect(409);
    });

    it('returns 404 when task not found', async () => {
      taskService.moveAreaKanbanTask.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .post('/areas/area-id/kanban-moves')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ taskId: 'c0000000-0000-4000-8000-000000000001', targetAreaStatusId: STATUS_ID })
        .expect(404);
    });
  });

  describe('POST /areas/:areaId/statuses', () => {
    it('creates a new status', async () => {
      areaService.createAreaStatus.mockResolvedValue({
        outcome: 'SUCCESS',
        status: {
          id: 'b0000000-0000-4000-8000-000000000010',
          userId: 'user-id',
          areaId: 'area-id',
          name: 'İnceleme',
          normalizedName: 'inceleme',
          canonicalStatus: 'IN_PROGRESS',
          position: 4,
          isDefault: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        areaVersion: 2,
      });

      const response = await request(app.getHttpServer())
        .post('/areas/area-id/statuses')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ name: 'İnceleme', canonicalStatus: 'IN_PROGRESS' })
        .expect(201);

      expect(response.body.data).toMatchObject({ name: 'İnceleme' });
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/areas/area-id/statuses')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ name: 'Test', canonicalStatus: 'TO_DO' })
        .expect(401);
    });

    it('returns 422 without If-Match', async () => {
      await request(app.getHttpServer())
        .post('/areas/area-id/statuses')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .send({ name: 'Test', canonicalStatus: 'TO_DO' })
        .expect(422);
    });
  });

  describe('PATCH /areas/:areaId/statuses/:statusId', () => {
    it('renames a status', async () => {
      areaService.updateAreaStatusName.mockResolvedValue({
        outcome: 'SUCCESS',
        status: {
          id: STATUS_ID,
          userId: 'user-id',
          areaId: 'area-id',
          name: 'Yeni Ad',
          normalizedName: 'yeni ad',
          canonicalStatus: 'TO_DO',
          position: 1,
          isDefault: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        areaVersion: 2,
      });

      const response = await request(app.getHttpServer())
        .patch(`/areas/area-id/statuses/${STATUS_ID}`)
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ name: 'Yeni Ad' })
        .expect(200);

      expect(response.body.data).toMatchObject({ name: 'Yeni Ad' });
    });

    it('returns 409 for stale version', async () => {
      areaService.updateAreaStatusName.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .patch(`/areas/area-id/statuses/${STATUS_ID}`)
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ name: 'Test' })
        .expect(409);
    });
  });

  describe('POST /areas/:areaId/statuses/:statusId/retire', () => {
    it('retires a status', async () => {
      areaService.retireAreaStatus.mockResolvedValue({
        outcome: 'SUCCESS',
        areaVersion: 2,
        migratedCount: 2,
      });

      const response = await request(app.getHttpServer())
        .post(`/areas/area-id/statuses/${STATUS_ID}/retire`)
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({ version: 2 });
    });

    it('returns 422 for default status', async () => {
      areaService.retireAreaStatus.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Varsayılan durumlar emekli edilemez.',
      });

      await request(app.getHttpServer())
        .post(`/areas/area-id/statuses/${STATUS_ID}/retire`)
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(422);
    });
  });

  describe('POST /areas/:areaId/statuses/:statusId/activate', () => {
    it('activates a status', async () => {
      areaService.activateAreaStatus.mockResolvedValue({
        outcome: 'SUCCESS',
        areaVersion: 2,
      });

      const response = await request(app.getHttpServer())
        .post(`/areas/area-id/statuses/${STATUS_ID}/activate`)
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({ version: 2 });
    });
  });

  describe('PUT /areas/:areaId/statuses/reorder', () => {
    it('reorders statuses', async () => {
      areaService.reorderAreaStatuses.mockResolvedValue({
        outcome: 'SUCCESS',
        areaVersion: 2,
      });

      const STATUS_2 = 'b0000000-0000-4000-8000-000000000003';

      const response = await request(app.getHttpServer())
        .put('/areas/area-id/statuses/reorder')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ statusIds: [STATUS_ID, STATUS_2] })
        .expect(200);

      expect(response.body.data).toMatchObject({ version: 2 });
    });

    it('returns 422 for empty list', async () => {
      areaService.reorderAreaStatuses.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'En az bir durum seçmelisiniz.',
      });

      await request(app.getHttpServer())
        .put('/areas/area-id/statuses/reorder')
        .set('Cookie', 'planner-session=token')
        .set('Content-Type', 'application/json')
        .set('If-Match', '1')
        .send({ statusIds: [] })
        .expect(422);
    });
  });
});
