import 'reflect-metadata';

import { Controller, Get } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

@Controller('boom')
class ThrowingController {
  @Get()
  throwUnexpectedError(): never {
    throw new Error('private internal detail');
  }
}

describe('foundation HTTP surface', () => {
  let app: INestApplication;

  beforeAll(async () => {
    Object.assign(process.env, {
      COOKIE_SECURE: 'false',
      DATABASE_URL: 'postgresql://planner:planner@127.0.0.1:5432/planner',
      LOG_LEVEL: 'silent',
      NODE_ENV: 'test',
      PORT: '3001',
      PUBLIC_ORIGIN: 'http://localhost:3000',
      TRUST_PROXY_HOPS: '0',
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ThrowingController],
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['health/live', 'health/ready'],
    });
    app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes liveness outside the versioned product contract', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200, {
      status: 'ok',
    });
  });

  it('exposes only the minimal versioned foundation contract', async () => {
    await request(app.getHttpServer()).get('/api/v1/version').expect(200, {
      version: '0.0.0',
    });
  });

  it('maps unknown errors to generic RFC 9457-compatible details', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/boom').expect(500);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({
      detail: 'An unexpected error occurred.',
      status: 500,
      traceId: expect.any(String),
      type: 'about:blank',
    });
    expect(response.headers['x-request-id']).toBe(response.body.traceId);
    expect(JSON.stringify(response.body)).not.toContain('private internal detail');
  });
});
