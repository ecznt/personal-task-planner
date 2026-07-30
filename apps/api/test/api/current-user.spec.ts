import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { ReadCurrentUserService } from '../../src/modules/accounts/application/read-current-user.service';
import { UserController } from '../../src/modules/accounts/transport/user.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('current user HTTP contract', () => {
  let app: INestApplication;
  const readCurrentUser = {
    execute: jest.fn<ReadCurrentUserService['execute']>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: ReadCurrentUserService,
          useValue: readCurrentUser,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    readCurrentUser.execute.mockResolvedValue({
      authenticated: true,
      etag: '"safe-user-etag"',
      profile: {
        accountLifecycleState: 'ACTIVE',
        inAppReminderNotificationsEnabled: true,
        normalizedPrimaryEmail: 'user@example.com',
        onboardingState: 'PENDING',
        primaryEmail: 'User@example.com',
        timeZone: 'Europe/Istanbul',
        userId: '018f9f7c-0000-7000-8000-000000000001',
        version: 3,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns only the current session-resolved user profile with an ETag', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', 'planner-session=raw-session-secret')
      .expect(200);

    expect(readCurrentUser.execute).toHaveBeenCalledWith('raw-session-secret');
    expect(response.headers.etag).toBe('"safe-user-etag"');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      data: {
        accountLifecycleState: 'ACTIVE',
        email: 'User@example.com',
        id: '018f9f7c-0000-7000-8000-000000000001',
        inAppReminderNotificationsEnabled: true,
        onboardingState: 'PENDING',
        timeZone: 'Europe/Istanbul',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(JSON.stringify(response.body)).not.toContain('raw-session-secret');
    expect(JSON.stringify(response.body)).not.toContain('normalizedPrimaryEmail');
    expect(JSON.stringify(response.body)).not.toContain('version');
  });

  it('requires an authenticated current session and exposes no arbitrary user route', async () => {
    readCurrentUser.execute.mockResolvedValueOnce({
      authenticated: false,
    });

    const unauthorized = await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

    expect(unauthorized.body).toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
    });
    await request(app.getHttpServer())
      .get('/api/v1/users/018f9f7c-0000-7000-8000-000000000001')
      .expect(404);
  });
});
