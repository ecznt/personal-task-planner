import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { LoginService } from '../../src/modules/accounts/application/login.service';
import { ReadSessionService } from '../../src/modules/accounts/application/read-session.service';
import { AnonymousCsrfGuard } from '../../src/modules/accounts/transport/anonymous-csrf.guard';
import { SessionController } from '../../src/modules/accounts/transport/session.controller';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('session HTTP contract', () => {
  let app: INestApplication;
  const csrf = {
    isValid: jest.fn<CsrfService['isValid']>(),
  };
  const login = {
    execute: jest.fn<LoginService['execute']>(),
  };
  const readSession = {
    execute: jest.fn<ReadSessionService['execute']>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        AnonymousCsrfGuard,
        {
          provide: CsrfService,
          useValue: csrf,
        },
        {
          provide: LoginService,
          useValue: login,
        },
        {
          provide: ReadSessionService,
          useValue: readSession,
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
    login.execute.mockResolvedValue({
      absoluteExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
      idleExpiresAt: new Date('2026-07-26T12:00:00.000Z'),
      next: '/app/today',
      outcome: 'AUTHENTICATED',
      primaryEmail: 'user@example.com',
      sessionToken: 'raw-session-secret',
    });
    readSession.execute.mockResolvedValue({
      authenticated: false,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets an HttpOnly opaque cookie and never returns its value', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/sessions')
      .set('Cookie', 'planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        email: 'user@example.com',
        password: 'correct password',
        returnTo: '/app/today',
      })
      .expect(200);

    expect(response.headers['set-cookie']?.[0]).toContain('planner-session=');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(response.body).toEqual({
      data: {
        absoluteExpiresAt: '2026-08-02T00:00:00.000Z',
        authenticated: true,
        email: 'user@example.com',
        idleExpiresAt: '2026-07-26T12:00:00.000Z',
        next: '/app/today',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('raw-session-secret');
  });

  it('does not follow an external return destination', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/sessions')
      .set('Cookie', 'planner-csrf-context=browser-context')
      .set('Origin', 'http://127.0.0.1:3000')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        email: 'user@example.com',
        password: 'correct password',
        returnTo: 'https://attacker.example/steal',
      })
      .expect(200);

    expect(login.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        returnTo: '/app/today',
      }),
    );
  });

  it.each([
    {
      code: 'AUTHENTICATION_FAILED',
      outcome: 'AUTHENTICATION_FAILED',
      status: 401,
    },
    {
      code: 'EMAIL_VERIFICATION_REQUIRED',
      outcome: 'EMAIL_VERIFICATION_REQUIRED',
      status: 409,
    },
  ] as const)(
    'maps $outcome without exposing credential details',
    async ({ code, outcome, status }) => {
      login.execute.mockResolvedValueOnce({
        outcome,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/sessions')
        .set('Cookie', 'planner-csrf-context=browser-context')
        .set('Origin', 'http://127.0.0.1:3000')
        .set('X-CSRF-Token', 'csrf-token')
        .send({
          email: 'user@example.com',
          password: 'private password',
        })
        .expect(status);

      expect(response.body).toMatchObject({
        code,
        status,
      });
      expect(JSON.stringify(response.body)).not.toContain('private password');
    },
  );

  it('represents a missing or invalid cookie as unauthenticated', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/auth/session').expect(200);

    expect(response.body).toEqual({
      data: {
        authenticated: false,
      },
    });
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
