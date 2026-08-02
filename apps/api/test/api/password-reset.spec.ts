import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { ReauthenticateService } from '../../src/modules/accounts/application/reauthenticate.service';
import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { RequestEmailVerificationService } from '../../src/modules/accounts/application/request-email-verification.service';
import { RequestPasswordResetService } from '../../src/modules/accounts/application/request-password-reset.service';
import { ResetPasswordService } from '../../src/modules/accounts/application/reset-password.service';
import { VerifyEmailService } from '../../src/modules/accounts/application/verify-email.service';
import { AnonymousCsrfGuard } from '../../src/modules/accounts/transport/anonymous-csrf.guard';
import { AuthController } from '../../src/modules/accounts/transport/auth.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('password reset HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
    issue: jest.fn<CsrfService['issue']>(),
  };
  const requestReset = {
    execute: jest.fn<RequestPasswordResetService['execute']>(),
  };
  const resetPassword = {
    execute: jest.fn<ResetPasswordService['execute']>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AnonymousCsrfGuard,
        {
          provide: CsrfService,
          useValue: csrf,
        },
        {
          provide: RegisterAccountService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RequestEmailVerificationService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: VerifyEmailService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RequestPasswordResetService,
          useValue: requestReset,
        },
        {
          provide: ResetPasswordService,
          useValue: resetPassword,
        },
        {
          provide: ReauthenticateService,
          useValue: {
            execute: jest.fn(),
          },
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
    csrf.issue.mockResolvedValue({
      browserToken: 'browser-secret',
      csrfToken: 'csrf-secret',
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
    });
    csrf.isValid.mockResolvedValue(true);
    requestReset.execute.mockResolvedValue({
      outcome: 'ACCEPTED',
    });
    resetPassword.execute.mockResolvedValue({
      outcome: 'RESET',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the same accepted reset request response without disclosing account state', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const headers = {
      Origin: 'http://127.0.0.1:3000',
      'X-CSRF-Token': csrfResponse.body.data.token as string,
    };

    const first = await agent
      .post('/api/v1/auth/password-reset-requests')
      .set(headers)
      .send({ email: 'user@example.com' })
      .expect(202);
    const second = await agent
      .post('/api/v1/auth/password-reset-requests')
      .set(headers)
      .send({ email: 'missing@example.com' })
      .expect(202);

    expect(first.body).toEqual(second.body);
    expect(first.body).toEqual({
      data: {
        status: 'PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE',
      },
    });
    expect(first.headers['cache-control']).toBe('no-store');
  });

  it('requires CSRF and Idempotency-Key and passes the reset token only in the body', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);

    await agent
      .post('/api/v1/auth/password-resets')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000001')
      .send({
        password: 'a changed password',
        passwordConfirmation: 'a changed password',
        token: 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
      })
      .expect(204);

    expect(resetPassword.execute).toHaveBeenCalledWith({
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000001',
      networkAddress: expect.anything(),
      password: 'a changed password',
      token: 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
    });

    const missingKey = await agent
      .post('/api/v1/auth/password-resets')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .send({
        password: 'a changed password',
        passwordConfirmation: 'a changed password',
        token: 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
      })
      .expect(422);

    expect(missingKey.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [
        expect.objectContaining({
          path: '/headers/idempotency-key',
        }),
      ],
    });
  });

  it.each([
    {
      code: 'PASSWORD_RESET_INVALID_OR_EXPIRED',
      outcome: 'INVALID_OR_EXPIRED',
      status: 422,
    },
    {
      code: 'IDEMPOTENCY_KEY_REUSED',
      outcome: 'IDEMPOTENCY_KEY_REUSED',
      status: 422,
    },
    {
      code: 'IDEMPOTENCY_IN_PROGRESS',
      outcome: 'IDEMPOTENCY_IN_PROGRESS',
      status: 409,
    },
  ] as const)('maps $outcome to a safe problem', async ({ outcome, status, code }) => {
    resetPassword.execute.mockResolvedValueOnce({ outcome });
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const rawToken = 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789';
    const rawPassword = 'a changed password';

    const response = await agent
      .post('/api/v1/auth/password-resets')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .set('Idempotency-Key', `018f9f7c-0000-7000-8000-${outcome}`)
      .send({
        password: rawPassword,
        passwordConfirmation: rawPassword,
        token: rawToken,
      })
      .expect(status);

    expect(response.body).toMatchObject({
      code,
      status,
    });
    expect(JSON.stringify(response.body)).not.toContain(rawToken);
    expect(JSON.stringify(response.body)).not.toContain(rawPassword);
  });
});
