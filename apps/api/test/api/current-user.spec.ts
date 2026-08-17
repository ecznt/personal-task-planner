import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { CompleteOnboardingService } from '../../src/modules/accounts/application/complete-onboarding.service';
import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { InitiateAccountDeletionService } from '../../src/modules/accounts/application/initiate-account-deletion.service';
import { ReadCurrentUserService } from '../../src/modules/accounts/application/read-current-user.service';
import { UpdateCurrentUserService } from '../../src/modules/accounts/application/update-current-user.service';
import { AnonymousCsrfGuard } from '../../src/modules/accounts/transport/anonymous-csrf.guard';
import { UserController } from '../../src/modules/accounts/transport/user.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('current user HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
  };
  const completeOnboarding = {
    execute: jest.fn<CompleteOnboardingService['execute']>(),
    etagFor: jest.fn<CompleteOnboardingService['etagFor']>(),
  };
  const initiateAccountDeletion = {
    execute: jest.fn<InitiateAccountDeletionService['execute']>(),
  };
  const readCurrentUser = {
    execute: jest.fn<ReadCurrentUserService['execute']>(),
  };
  const updateCurrentUser = {
    execute: jest.fn<UpdateCurrentUserService['execute']>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        AnonymousCsrfGuard,
        {
          provide: CompleteOnboardingService,
          useValue: completeOnboarding,
        },
        {
          provide: CsrfService,
          useValue: csrf,
        },
        {
          provide: InitiateAccountDeletionService,
          useValue: initiateAccountDeletion,
        },
        {
          provide: ReadCurrentUserService,
          useValue: readCurrentUser,
        },
        {
          provide: UpdateCurrentUserService,
          useValue: updateCurrentUser,
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
    csrf.isValid.mockResolvedValue(true);
    completeOnboarding.etagFor.mockReturnValue('"completed-user-etag"');
    completeOnboarding.execute.mockResolvedValue({
      completion: {
        choice: 'START_EMPTY',
        completedAt: new Date('2026-08-17T09:00:00.000Z'),
        next: '/app/today',
        profile: {
          accountLifecycleState: 'ACTIVE',
          inAppReminderNotificationsEnabled: true,
          normalizedPrimaryEmail: 'user@example.com',
          onboardingCompletedAt: new Date('2026-08-17T09:00:00.000Z'),
          onboardingState: 'COMPLETED',
          primaryEmail: 'User@example.com',
          timeZone: 'Europe/Istanbul',
          userId: '018f9f7c-0000-7000-8000-000000000001',
          version: 5,
        },
        status: 'COMPLETED',
      },
      outcome: 'COMPLETED',
    });
    initiateAccountDeletion.execute.mockResolvedValue({
      outcome: 'ACCEPTED',
      process: {
        accessRevokedAt: new Date('2026-07-30T09:00:00.000Z'),
        processId: '018f9f7c-0000-7000-8000-000000000099',
        requestedAt: new Date('2026-07-30T09:00:00.000Z'),
        state: 'PENDING_PRIMARY_PURGE',
      },
    });
    readCurrentUser.execute.mockResolvedValue({
      authenticated: true,
      etag: '"safe-user-etag"',
      profile: {
        accountLifecycleState: 'ACTIVE',
        inAppReminderNotificationsEnabled: true,
        normalizedPrimaryEmail: 'user@example.com',
        onboardingCompletedAt: null,
        onboardingState: 'PENDING',
        primaryEmail: 'User@example.com',
        timeZone: 'Europe/Istanbul',
        userId: '018f9f7c-0000-7000-8000-000000000001',
        version: 3,
      },
    });
    updateCurrentUser.execute.mockResolvedValue({
      etag: '"updated-user-etag"',
      outcome: 'UPDATED',
      profile: {
        accountLifecycleState: 'ACTIVE',
        inAppReminderNotificationsEnabled: true,
        normalizedPrimaryEmail: 'user@example.com',
        onboardingCompletedAt: null,
        onboardingState: 'PENDING',
        primaryEmail: 'User@example.com',
        timeZone: 'Europe/Istanbul',
        userId: '018f9f7c-0000-7000-8000-000000000001',
        version: 4,
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

  it('updates the current user time zone with CSRF and If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"safe-user-etag"')
      .send({
        timeZone: 'Europe/Istanbul',
      })
      .expect(200);

    expect(updateCurrentUser.execute).toHaveBeenCalledWith({
      etag: '"safe-user-etag"',
      sessionToken: 'raw-session-secret',
      timeZone: 'Europe/Istanbul',
    });
    expect(response.headers.etag).toBe('"updated-user-etag"');
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
  });

  it('rejects unsupported current user time zones before mutation', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"safe-user-etag"')
      .send({
        timeZone: 'Mars/Base',
      })
      .expect(422);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
    expect(updateCurrentUser.execute).not.toHaveBeenCalled();
  });

  it('requires If-Match for current user preference updates', async () => {
    updateCurrentUser.execute.mockResolvedValueOnce({
      outcome: 'PRECONDITION_REQUIRED',
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        timeZone: 'Europe/Istanbul',
      })
      .expect(428);

    expect(response.body).toMatchObject({
      code: 'PRECONDITION_REQUIRED',
      status: 428,
    });
  });

  it('rejects stale current user preference updates', async () => {
    updateCurrentUser.execute.mockResolvedValueOnce({
      outcome: 'PRECONDITION_FAILED',
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"stale-user-etag"')
      .send({
        timeZone: 'Europe/Istanbul',
      })
      .expect(412);

    expect(response.body).toMatchObject({
      code: 'PRECONDITION_FAILED',
      status: 412,
    });
  });

  it('completes start-empty onboarding with CSRF, If-Match and idempotency', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/onboarding-completions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"updated-user-etag"')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000018')
      .send({
        choice: 'START_EMPTY',
      })
      .expect(200);

    expect(completeOnboarding.execute).toHaveBeenCalledWith({
      choice: 'START_EMPTY',
      etag: '"updated-user-etag"',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000018',
      sessionToken: 'raw-session-secret',
    });
    expect(response.headers.etag).toBe('"completed-user-etag"');
    expect(response.body).toEqual({
      data: {
        choice: 'START_EMPTY',
        completedAt: '2026-08-17T09:00:00.000Z',
        next: '/app/today',
        status: 'COMPLETED',
        user: {
          accountLifecycleState: 'ACTIVE',
          email: 'User@example.com',
          id: '018f9f7c-0000-7000-8000-000000000001',
          inAppReminderNotificationsEnabled: true,
          onboardingState: 'COMPLETED',
          timeZone: 'Europe/Istanbul',
        },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(JSON.stringify(response.body)).not.toContain('normalizedPrimaryEmail');
    expect(JSON.stringify(response.body)).not.toContain('version');
  });

  it('does not accept sample-data onboarding completion in the start-empty slice', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/onboarding-completions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"updated-user-etag"')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000019')
      .send({
        choice: 'CREATE_SAMPLE_DATA',
      })
      .expect(422);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
    expect(completeOnboarding.execute).not.toHaveBeenCalled();
  });

  it('requires If-Match for onboarding completion', async () => {
    completeOnboarding.execute.mockResolvedValueOnce({
      outcome: 'PRECONDITION_REQUIRED',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/onboarding-completions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000020')
      .send({
        choice: 'START_EMPTY',
      })
      .expect(428);

    expect(response.body).toMatchObject({
      code: 'PRECONDITION_REQUIRED',
      status: 428,
    });
  });

  it('starts account deletion only from the current session with CSRF, ETag, idempotency and explicit confirmation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/account-deletions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"safe-user-etag"')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000015')
      .send({
        acknowledgedPermanentDeletion: true,
        confirmation: 'DELETE_MY_ACCOUNT',
      })
      .expect(202);

    expect(initiateAccountDeletion.execute).toHaveBeenCalledWith({
      confirmation: 'DELETE_MY_ACCOUNT',
      etag: '"safe-user-etag"',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000015',
      sessionToken: 'raw-session-secret',
    });
    expect(String(response.headers['set-cookie'])).toContain('planner-session=;');
    expect(response.body).toEqual({
      data: {
        accessRevokedAt: '2026-07-30T09:00:00.000Z',
        primaryPurgePending: true,
        processId: '018f9f7c-0000-7000-8000-000000000099',
        requestedAt: '2026-07-30T09:00:00.000Z',
        state: 'PENDING_PRIMARY_PURGE',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('raw-session-secret');
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('requires recent reauthentication before account deletion', async () => {
    initiateAccountDeletion.execute.mockResolvedValueOnce({
      outcome: 'REAUTHENTICATION_REQUIRED',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/account-deletions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('If-Match', '"safe-user-etag"')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000016')
      .send({
        acknowledgedPermanentDeletion: true,
        confirmation: 'DELETE_MY_ACCOUNT',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'REAUTHENTICATION_REQUIRED',
      status: 401,
    });
  });

  it('requires If-Match for account deletion initiation', async () => {
    initiateAccountDeletion.execute.mockResolvedValueOnce({
      outcome: 'PRECONDITION_REQUIRED',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/users/me/account-deletions')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000017')
      .send({
        acknowledgedPermanentDeletion: true,
        confirmation: 'DELETE_MY_ACCOUNT',
      })
      .expect(428);

    expect(response.body).toMatchObject({
      code: 'PRECONDITION_REQUIRED',
      status: 428,
    });
  });
});
