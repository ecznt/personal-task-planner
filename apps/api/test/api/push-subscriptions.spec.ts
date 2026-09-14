import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { PushService } from '../../src/modules/planning/application/push.service';
import { PushController } from '../../src/modules/planning/transport/push.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('push subscription HTTP contract', () => {
  let app: INestApplication;
  const pushService = {
    enroll: jest.fn<PushService['enroll']>(),
    remove: jest.fn<PushService['remove']>(),
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
      controllers: [PushController],
      providers: [
        { provide: PushService, useValue: pushService },
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

  describe('POST /push-subscriptions', () => {
    it('registers a subscription for the session user', async () => {
      pushService.enroll.mockResolvedValue({
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        endpoint: 'https://push.example.com/device-1',
        id: 'sub-1',
        keysAuth: 'auth-1',
        keysP256dh: 'p256-1',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        userId: 'user-id',
      });

      const response = await request(app.getHttpServer())
        .post('/push-subscriptions')
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'sub-1')
        .send({
          endpoint: 'https://push.example.com/device-1',
          keys: { p256dh: 'p256-1', auth: 'auth-1' },
        })
        .expect(201);

      expect(pushService.enroll).toHaveBeenCalledWith('user-id', {
        endpoint: 'https://push.example.com/device-1',
        keysAuth: 'auth-1',
        keysP256dh: 'p256-1',
      });
      expect(response.body).toEqual({ data: { id: 'sub-1' } });
    });

    it('requires an idempotency key', async () => {
      const response = await request(app.getHttpServer())
        .post('/push-subscriptions')
        .set('Cookie', 'planner-session=token')
        .send({
          endpoint: 'https://push.example.com/device-1',
          keys: { p256dh: 'p256-1', auth: 'auth-1' },
        })
        .expect(400);

      expect(response.body).toMatchObject({ code: 'MISSING_IDEMPOTENCY_KEY', status: 400 });
      expect(pushService.enroll).not.toHaveBeenCalled();
    });

    it('rejects a malformed subscription body', async () => {
      const response = await request(app.getHttpServer())
        .post('/push-subscriptions')
        .set('Cookie', 'planner-session=token')
        .set('Idempotency-Key', 'sub-1')
        .send({ endpoint: 'not-a-url' })
        .expect(400);

      expect(response.body).toMatchObject({ code: 'INVALID_INPUT', status: 400 });
      expect(pushService.enroll).not.toHaveBeenCalled();
    });

    it('returns 401 without a session', async () => {
      accountsRepository.findAuthenticatedSession.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/push-subscriptions')
        .set('Idempotency-Key', 'sub-1')
        .send({
          endpoint: 'https://push.example.com/device-1',
          keys: { p256dh: 'p256-1', auth: 'auth-1' },
        })
        .expect(401);
    });
  });

  describe('DELETE /push-subscriptions', () => {
    it('removes the given subscription for the session user', async () => {
      pushService.remove.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .delete('/push-subscriptions')
        .set('Cookie', 'planner-session=token')
        .send({ endpoint: 'https://push.example.com/device-1' })
        .expect(200);

      expect(pushService.remove).toHaveBeenCalledWith('user-id', 'https://push.example.com/device-1');
      expect(response.body).toEqual({ data: { success: true } });
    });

    it('returns 404 when the subscription does not exist', async () => {
      pushService.remove.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .delete('/push-subscriptions')
        .set('Cookie', 'planner-session=token')
        .send({ endpoint: 'https://push.example.com/device-1' })
        .expect(404);

      expect(response.body).toMatchObject({ code: 'RESOURCE_NOT_FOUND', status: 404 });
    });
  });
});