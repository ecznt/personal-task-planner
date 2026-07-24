import { PassThrough } from 'node:stream';

import { describe, expect, it } from '@jest/globals';
import pino from 'pino';

import { createPinoOptions } from '../../src/platform/logging/logger';

describe('privacy-safe logging', () => {
  it('redacts configured credential and authored-content fields', async () => {
    process.env.LOG_LEVEL = 'info';
    process.env.NODE_ENV = 'test';
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));
    const logger = pino(createPinoOptions('api'), output);

    logger.info({
      databaseUrl: 'postgresql://secret',
      password: 'private-password',
      req: {
        body: {
          title: 'private task title',
        },
        headers: {
          authorization: 'Bearer private-token',
          cookie: 'session=private',
        },
      },
    });
    await new Promise<void>((resolve) => output.end(resolve));

    const serialized = chunks.join('');
    expect(serialized).not.toContain('private-password');
    expect(serialized).not.toContain('private task title');
    expect(serialized).not.toContain('private-token');
    expect(serialized).not.toContain('postgresql://secret');
    expect(serialized).toContain('[REDACTED]');
  });
});
