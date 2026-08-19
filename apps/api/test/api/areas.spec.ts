import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { AreaService } from '../../src/modules/planning/application/area.service';
import { AreaController } from '../../src/modules/planning/transport/area.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('area HTTP contract', () => {
  let app: INestApplication;
  const areaService = {
    createArea: jest.fn<AreaService['createArea']>(),
    getArea: jest.fn<AreaService['getArea']>(),
    listAreas: jest.fn<AreaService['listAreas']>(),
    renameArea: jest.fn<AreaService['renameArea']>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AreaController],
      providers: [
        {
          provide: AreaService,
          useValue: areaService,
        },
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
});
