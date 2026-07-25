import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { RequestEmailVerificationService } from '../../src/modules/accounts/application/request-email-verification.service';
import { VerifyEmailService } from '../../src/modules/accounts/application/verify-email.service';
import { AnonymousCsrfGuard } from '../../src/modules/accounts/transport/anonymous-csrf.guard';
import { AuthController } from '../../src/modules/accounts/transport/auth.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('email verification HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
    issue: jest.fn<CsrfService['issue']>(),
  };
  const requestVerification = {
    execute: jest.fn<RequestEmailVerificationService['execute']>(),
  };
  const verification = {
    execute: jest.fn<VerifyEmailService['execute']>(),
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
          useValue: requestVerification,
        },
        {
          provide: VerifyEmailService,
          useValue: verification,
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
    requestVerification.execute.mockResolvedValue({
      outcome: 'ACCEPTED',
    });
    verification.execute.mockResolvedValue({
      outcome: 'VERIFIED',
      response: {
        data: {
          next: '/login',
          status: 'VERIFIED',
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the same resend response without disclosing account state', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const headers = {
      Origin: 'http://127.0.0.1:3000',
      'X-CSRF-Token': csrfResponse.body.data.token as string,
    };

    const first = await agent
      .post('/api/v1/auth/email-verification-requests')
      .set(headers)
      .send({ email: 'pending@example.com' })
      .expect(202);
    const second = await agent
      .post('/api/v1/auth/email-verification-requests')
      .set(headers)
      .send({ email: 'missing@example.com' })
      .expect(202);

    expect(first.body).toEqual(second.body);
    expect(first.body).toEqual({
      data: {
        status: 'VERIFICATION_EMAIL_SENT_IF_ELIGIBLE',
      },
    });
    expect(first.headers['cache-control']).toBe('no-store');
  });

  it('requires CSRF and Idempotency-Key and passes the code only in the body', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);

    const response = await agent
      .post('/api/v1/auth/email-verifications')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .set('Idempotency-Key', '018f9f7c-0000-7000-8000-000000000001')
      .send({
        code: '12345678',
        email: 'user@example.com',
      })
      .expect(200);

    expect(verification.execute).toHaveBeenCalledWith({
      code: '12345678',
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000001',
      networkAddress: expect.anything(),
    });
    expect(response.body).toEqual({
      data: {
        next: '/login',
        status: 'VERIFIED',
      },
    });
    expect(response.headers['cache-control']).toBe('no-store');

    const missingKey = await agent
      .post('/api/v1/auth/email-verifications')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .send({
        code: '12345678',
        email: 'user@example.com',
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
      code: 'VERIFICATION_INVALID_OR_EXPIRED',
      outcome: 'INVALID_OR_EXPIRED',
      status: 422,
    },
    {
      code: 'VERIFICATION_ALREADY_USED',
      outcome: 'ALREADY_USED',
      status: 409,
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
    verification.execute.mockResolvedValueOnce({ outcome });
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);

    const response = await agent
      .post('/api/v1/auth/email-verifications')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .set('Idempotency-Key', `018f9f7c-0000-7000-8000-${outcome}`)
      .send({
        code: '12345678',
        email: 'user@example.com',
      })
      .expect(status);

    expect(response.body).toMatchObject({
      code,
      status,
    });
    expect(JSON.stringify(response.body)).not.toContain('12345678');
  });
});
