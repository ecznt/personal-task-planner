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

describe('registration HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
    issue: jest.fn<CsrfService['issue']>(),
  };
  const registration = {
    execute: jest.fn<RegisterAccountService['execute']>(),
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
          useValue: registration,
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
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ResetPasswordService,
          useValue: {
            execute: jest.fn(),
          },
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
    csrf.issue.mockResolvedValue({
      browserToken: 'browser-secret',
      csrfToken: 'csrf-secret',
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
    });
    csrf.isValid.mockResolvedValue(true);
    registration.execute.mockResolvedValue({
      outcome: 'ACCEPTED',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues a non-cacheable CSRF token bound to an HttpOnly browser cookie', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(response.body).toMatchObject({
      data: {
        token: 'csrf-secret',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('browser-secret');
  });

  it('returns one generic accepted shape for different valid emails', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const token = csrfResponse.body.data.token as string;
    const payload = {
      password: 'twelve-chars!',
      passwordConfirmation: 'twelve-chars!',
      termsAccepted: true,
    };

    const first = await agent
      .post('/api/v1/auth/register')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', token)
      .send({
        ...payload,
        email: 'new@example.com',
      })
      .expect(202);
    const second = await agent
      .post('/api/v1/auth/register')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', token)
      .send({
        ...payload,
        email: 'retained@example.com',
      })
      .expect(202);

    expect(first.body).toEqual(second.body);
    expect(first.body).toEqual({
      data: {
        next: '/verify-email',
        status: 'VERIFICATION_REQUIRED',
      },
    });
  });

  it('rejects invalid origins without probing registration state', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);

    const response = await agent
      .post('/api/v1/auth/register')
      .set('Origin', 'https://attacker.example')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .send({
        email: 'user@example.com',
        password: 'twelve-chars!',
        passwordConfirmation: 'twelve-chars!',
        termsAccepted: true,
      })
      .expect(403);

    expect(response.body).toMatchObject({
      code: 'REQUEST_FORBIDDEN',
      status: 403,
    });
    expect(registration.execute).not.toHaveBeenCalled();
  });

  it('returns safe 422 details without password echo', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);
    const rejectedPassword = 'private-value';

    const response = await agent
      .post('/api/v1/auth/register')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .send({
        email: 'invalid',
        password: rejectedPassword,
        passwordConfirmation: 'different-value',
        termsAccepted: false,
      })
      .expect(422);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: expect.any(Array),
      status: 422,
    });
    expect(JSON.stringify(response.body)).not.toContain(rejectedPassword);
  });

  it('returns a generic rate-limit problem with Retry-After', async () => {
    registration.execute.mockResolvedValue({
      outcome: 'RATE_LIMITED',
      retryAfterSeconds: 120,
    });
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/v1/auth/csrf').expect(200);

    const response = await agent
      .post('/api/v1/auth/register')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', csrfResponse.body.data.token as string)
      .send({
        email: 'user@example.com',
        password: 'twelve-chars!',
        passwordConfirmation: 'twelve-chars!',
        termsAccepted: true,
      })
      .expect(429);

    expect(response.headers['retry-after']).toBe('120');
    expect(response.body).toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSeconds: 120,
    });
  });
});
