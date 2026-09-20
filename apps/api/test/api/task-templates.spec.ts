import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { TaskTemplateService } from '../../src/modules/planning/application/task-template.service';
import { TaskTemplateController } from '../../src/modules/planning/transport/task-template.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

const TEMPLATE_ID = 'd0000000-0000-4000-8000-000000000001';
const NON_EXISTENT_ID = 'd0000000-0000-4000-8000-0000000000ff';

describe('task template HTTP contract', () => {
  let app: INestApplication;
  const taskTemplateService = {
    createTemplate: jest.fn<TaskTemplateService['createTemplate']>(),
    listTemplates: jest.fn<TaskTemplateService['listTemplates']>(),
    getTemplate: jest.fn<TaskTemplateService['getTemplate']>(),
    updateTemplate: jest.fn<TaskTemplateService['updateTemplate']>(),
    deleteTemplate: jest.fn<TaskTemplateService['deleteTemplate']>(),
    applyTemplate: jest.fn<TaskTemplateService['applyTemplate']>(),
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
      controllers: [TaskTemplateController],
      providers: [
        { provide: TaskTemplateService, useValue: taskTemplateService },
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

  describe('GET /task-templates', () => {
    it('lists templates for the authenticated user', async () => {
      taskTemplateService.listTemplates.mockResolvedValue({
        outcome: 'SUCCESS',
        templates: [
          {
            id: TEMPLATE_ID,
            title: 'Haftalık Rapor',
            priority: 'HIGH',
            description: 'Haftalık raporu hazırla',
            checklistSteps: ['Veri topla'],
            labelNames: ['Ev'],
            defaultPlannedAtOffsetDays: 3,
            version: 1,
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
        nextCursor: 'cursor-1',
      });

      const response = await request(app.getHttpServer())
        .get('/task-templates')
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body.data).toEqual([
        expect.objectContaining({
          id: TEMPLATE_ID,
          title: 'Haftalık Rapor',
          priority: 'HIGH',
          description: 'Haftalık raporu hazırla',
          checklistSteps: ['Veri topla'],
          labelNames: ['Ev'],
          defaultPlannedAtOffsetDays: 3,
        }),
      ]);
      expect(response.body.meta.nextCursor).toBe('cursor-1');
    });

    it('returns 401 without session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/task-templates').expect(401);
    });
  });

  describe('POST /task-templates', () => {
    it('creates a template', async () => {
      taskTemplateService.createTemplate.mockResolvedValue({
        outcome: 'SUCCESS',
        template: {
          id: TEMPLATE_ID,
          userId: 'user-id',
          title: 'Haftalık Rapor',
          description: null,
          priority: 'HIGH',
          checklistSteps: ['Veri topla'],
          labelNames: ['Ev'],
          defaultPlannedAtOffsetDays: 3,
          version: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/task-templates')
        .send({
          title: 'Haftalık Rapor',
          priority: 'HIGH',
          checklistSteps: ['Veri topla'],
          labelNames: ['Ev'],
          defaultPlannedAtOffsetDays: 3,
        })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({ id: TEMPLATE_ID, title: 'Haftalık Rapor' });
    });

    it('requires Idempotency-Key', async () => {
      await request(app.getHttpServer())
        .post('/task-templates')
        .send({ title: 'Rapor' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('returns 422 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/task-templates')
        .send({ title: '' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });

    it('returns 422 for service validation errors', async () => {
      taskTemplateService.createTemplate.mockResolvedValue({
        outcome: 'VALIDATION_ERROR',
        detail: 'Şablon adı boş olamaz.',
      });

      await request(app.getHttpServer())
        .post('/task-templates')
        .send({ title: 'Rapor', checklistSteps: [''] })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(422);
    });
  });

  describe('PATCH /task-templates/:templateId', () => {
    it('updates a template', async () => {
      taskTemplateService.updateTemplate.mockResolvedValue({
        outcome: 'SUCCESS',
        template: {
          id: TEMPLATE_ID,
          userId: 'user-id',
          title: 'Güncel Rapor',
          description: null,
          priority: 'MEDIUM',
          checklistSteps: [],
          labelNames: [],
          defaultPlannedAtOffsetDays: null,
          version: 2,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
        etag: 2,
      });

      const response = await request(app.getHttpServer())
        .patch(`/task-templates/${TEMPLATE_ID}`)
        .send({ title: 'Güncel Rapor' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(200);

      expect(response.body.data).toMatchObject({ id: TEMPLATE_ID, version: 2 });
    });

    it('requires If-Match', async () => {
      await request(app.getHttpServer())
        .patch(`/task-templates/${TEMPLATE_ID}`)
        .send({ title: 'X' })
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('returns 404 when missing', async () => {
      taskTemplateService.updateTemplate.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .patch(`/task-templates/${NON_EXISTENT_ID}`)
        .send({ title: 'X' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(404);
    });

    it('returns 409 for stale version', async () => {
      taskTemplateService.updateTemplate.mockResolvedValue({ outcome: 'STALE_VERSION' });

      await request(app.getHttpServer())
        .patch(`/task-templates/${TEMPLATE_ID}`)
        .send({ title: 'X' })
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(409);
    });
  });

  describe('POST /task-templates/:templateId/apply', () => {
    it('instantiates a task from the template', async () => {
      taskTemplateService.applyTemplate.mockResolvedValue({
        outcome: 'SUCCESS',
        task: {
          id: 'task-1',
          userId: 'user-id',
          areaId: 'a0000000-0000-4000-8000-000000000001',
          title: 'Haftalık Rapor',
          description: null,
          plannedAt: null,
          dueAt: null,
          priority: 'HIGH',
          areaStatusId: 'status-1',
          projectId: null,
          parentTaskId: null,
          completedAt: null,
          lifecycleState: 'ACTIVE',
          globalRank: '000000000000000000000001',
          areaRank: '000000000000000000000001',
          version: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          recurrenceSeriesId: null,
          recurrenceRuleVersionId: null,
          occurrenceNumber: null,
          predecessorTaskId: null,
          generationKey: null,
        },
        etag: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/task-templates/${TEMPLATE_ID}/apply`)
        .send({ areaId: 'a0000000-0000-4000-8000-000000000001' })
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(201);

      expect(response.body.data).toMatchObject({
        id: 'task-1',
        title: 'Haftalık Rapor',
        areaId: 'a0000000-0000-4000-8000-000000000001',
        canonicalStatus: 'TO_DO',
      });
      expect(response.headers.etag).toBe('1');
    });

    it('returns 404 for unknown template', async () => {
      taskTemplateService.applyTemplate.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .post(`/task-templates/${NON_EXISTENT_ID}/apply`)
        .send({})
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'idem-key')
        .expect(404);
    });

    it('requires Idempotency-Key', async () => {
      await request(app.getHttpServer())
        .post(`/task-templates/${TEMPLATE_ID}/apply`)
        .send({})
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });
  });

  describe('DELETE /task-templates/:templateId', () => {
    it('deletes a template', async () => {
      taskTemplateService.deleteTemplate.mockResolvedValue({ outcome: 'SUCCESS' });

      await request(app.getHttpServer())
        .delete(`/task-templates/${TEMPLATE_ID}`)
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(204);
    });

    it('requires If-Match', async () => {
      await request(app.getHttpServer())
        .delete(`/task-templates/${TEMPLATE_ID}`)
        .set('Cookie', 'planner-session=token')
        .expect(422);
    });

    it('returns 404 when missing', async () => {
      taskTemplateService.deleteTemplate.mockResolvedValue({ outcome: 'NOT_FOUND' });

      await request(app.getHttpServer())
        .delete(`/task-templates/${NON_EXISTENT_ID}`)
        .set('Cookie', 'planner-session=token')
        .set('If-Match', '1')
        .expect(404);
    });
  });
});