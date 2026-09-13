import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { ProjectService } from '../../src/modules/planning/application/project.service';
import { ProjectController } from '../../src/modules/planning/transport/project.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

const AREA_ID = 'a0000000-0000-4000-8000-000000000001';
const PROJECT_ID = 'b0000000-0000-4000-8000-000000000002';
const NON_EXISTENT_ID = 'c0000000-0000-4000-8000-000000000003';

describe('project HTTP contract', () => {
  let app: INestApplication;
  const projectService = {
    createProject: jest.fn<ProjectService['createProject']>(),
    getProject: jest.fn<ProjectService['getProject']>(),
    listProjects: jest.fn<ProjectService['listProjects']>(),
    renameProject: jest.fn<ProjectService['renameProject']>(),
    moveProject: jest.fn<ProjectService['moveProject']>(),
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
      controllers: [ProjectController],
      providers: [
        { provide: ProjectService, useValue: projectService },
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

  describe('POST /projects', () => {
    it('creates a project with valid input', async () => {
      projectService.createProject.mockResolvedValue({
        outcome: 'SUCCESS',
        project: {
          id: PROJECT_ID,
          userId: 'user-id',
          areaId: AREA_ID,
          name: 'Test Project',
          normalizedName: 'test project',
          lifecycleState: 'ACTIVE',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Test Project', areaId: AREA_ID })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: PROJECT_ID,
        name: 'Test Project',
      });
    });

    it('returns 422 for validation error', async () => {
      projectService.createProject.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Proje adı boş olamaz.',
      });

      await request(app.getHttpServer())
        .post('/projects')
        .send({ name: '', areaId: AREA_ID })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });

    it('returns 404 when area not found', async () => {
      projectService.createProject.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Test', areaId: NON_EXISTENT_ID })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(404);
    });

    it('returns 422 for duplicate name', async () => {
      projectService.createProject.mockResolvedValue({
        outcome: 'DUPLICATE_NAME',
        detail: 'Bu alanda aynı isimde bir proje zaten mevcut.',
      });

      await request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Existing', areaId: AREA_ID })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });
  });

  describe('GET /projects', () => {
    it('lists projects for an area', async () => {
      projectService.listProjects.mockResolvedValue({
        outcome: 'SUCCESS',
        projects: [
          {
            id: PROJECT_ID,
            areaId: AREA_ID,
            name: 'Test Project',
            lifecycleState: 'ACTIVE',
            version: 1,
            taskCount: 3,
            completedTaskCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/projects')
        .query({ areaId: AREA_ID })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({ name: 'Test Project', taskCount: 3 });
    });
  });

  describe('GET /projects/:projectId', () => {
    it('returns project detail', async () => {
      projectService.getProject.mockResolvedValue({
        outcome: 'SUCCESS',
        project: {
          id: PROJECT_ID,
          areaId: AREA_ID,
          name: 'Test Project',
          lifecycleState: 'ACTIVE',
          version: 1,
          taskCount: 5,
          completedTaskCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .get(`/projects/${PROJECT_ID}`)
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: PROJECT_ID,
        name: 'Test Project',
        taskCount: 5,
      });
    });

    it('returns 404 for non-existent project', async () => {
      projectService.getProject.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .get(`/projects/${NON_EXISTENT_ID}`)
        .set('Cookie', 'planner-session=token')
        .expect(404);
    });
  });

  describe('PATCH /projects/:projectId', () => {
    it('renames project with valid input', async () => {
      projectService.renameProject.mockResolvedValue({
        outcome: 'SUCCESS',
        project: {
          id: PROJECT_ID,
          userId: 'user-id',
          areaId: AREA_ID,
          name: 'New Name',
          normalizedName: 'new name',
          lifecycleState: 'ACTIVE',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        etag: 2,
      });

      const response = await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: PROJECT_ID,
        name: 'New Name',
        version: 2,
      });
    });

    it('returns 409 for stale version', async () => {
      projectService.renameProject.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(409);
    });

    it('returns 404 for non-existent project', async () => {
      projectService.renameProject.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .patch(`/projects/${NON_EXISTENT_ID}`)
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(404);
    });

    it('returns 428 when If-Match header missing', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ name: 'New Name' })
        .set('Cookie', 'planner-session=token')
        .expect(428);
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ name: 'New Name' })
        .set('If-Match', '1')
        .expect(401);
    });

    it('moves project to another area', async () => {
      projectService.moveProject.mockResolvedValue({
        outcome: 'SUCCESS',
        project: {
          id: PROJECT_ID,
          userId: 'user-id',
          areaId: 'a0000000-0000-4000-8000-000000000002',
          name: 'Test Project',
          normalizedName: 'test project',
          lifecycleState: 'ACTIVE',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        etag: 2,
        movedTasks: 2,
      });

      const response = await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ areaId: 'a0000000-0000-4000-8000-000000000002' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(projectService.moveProject).toHaveBeenCalledWith('user-id', {
        projectId: PROJECT_ID,
        targetAreaId: 'a0000000-0000-4000-8000-000000000002',
        version: 1,
      });
      expect(response.body.data).toMatchObject({ id: PROJECT_ID, version: 2 });
    });

    it('rejects a PATCH that sends both name and areaId', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ name: 'New Name', areaId: AREA_ID })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(422);
    });

    it('returns 422 when moving to an area with a duplicate name', async () => {
      projectService.moveProject.mockResolvedValue({
        outcome: 'DUPLICATE_NAME',
        detail: 'Hedef alanda aynı isimde bir proje zaten mevcut.',
      });

      await request(app.getHttpServer())
        .patch(`/projects/${PROJECT_ID}`)
        .send({ areaId: 'a0000000-0000-4000-8000-000000000002' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(422);
    });
  });
});
