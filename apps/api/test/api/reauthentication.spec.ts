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

describe('reauthentication HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
    issue: jest.fn<CsrfService['issue']>(),
  };
  const reauthenticate = {
    execute: jest.fn<ReauthenticateService['execute']>(),
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
          useValue: reauthenticate,
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
    reauthenticate.execute.mockResolvedValue({
      action: 'ACCOUNT_DELETION',
      expiresAt: new Date('2026-07-30T09:15:00.000Z'),
      outcome: 'REAUTHENTICATED',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a short-lived server-side proof without returning a reusable secret', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/reauthentications')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        action: 'ACCOUNT_DELETION',
        password: 'correct password',
      })
      .expect(200);

    expect(reauthenticate.execute).toHaveBeenCalledWith({
      action: 'ACCOUNT_DELETION',
      networkAddress: expect.any(String),
      password: 'correct password',
      sessionToken: 'raw-session-secret',
    });
    expect(response.body).toEqual({
      data: {
        action: 'ACCOUNT_DELETION',
        expiresAt: '2026-07-30T09:15:00.000Z',
        status: 'REAUTHENTICATED',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('correct password');
    expect(JSON.stringify(response.body)).not.toContain('raw-session-secret');
  });

  it('uses a generic authentication failure for missing session or wrong password', async () => {
    reauthenticate.execute.mockResolvedValueOnce({
      outcome: 'AUTHENTICATION_FAILED',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/reauthentications')
      .set('Cookie', 'planner-session=raw-session-secret; planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        action: 'ACCOUNT_DELETION',
        password: 'wrong password',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'AUTHENTICATION_FAILED',
      status: 401,
    });
  });
});
