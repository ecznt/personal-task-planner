import { describe, expect, it } from '@jest/globals';

import { parseApiEnvironment, parseWorkerEnvironment } from '../../src/platform/config/environment';

const sharedEnvironment = {
  DATABASE_URL: 'postgresql://planner:planner@localhost:5432/planner',
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
};

describe('environment validation', () => {
  it('parses explicit API configuration', () => {
    expect(
      parseApiEnvironment({
        ...sharedEnvironment,
        AUTH_SECURITY_KEY: 'test-only-auth-security-key-32-chars',
        COOKIE_SECURE: 'false',
        PORT: '3001',
        PUBLIC_ORIGIN: 'http://localhost:3000',
        TRUST_PROXY_HOPS: '0',
      }),
    ).toMatchObject({
      COOKIE_SECURE: false,
      PORT: 3001,
      TRUST_PROXY_HOPS: 0,
    });
  });

  it('rejects an invalid API configuration before startup', () => {
    expect(() =>
      parseApiEnvironment({
        ...sharedEnvironment,
        AUTH_SECURITY_KEY: 'short',
        COOKIE_SECURE: 'sometimes',
        PORT: 'not-a-port',
        PUBLIC_ORIGIN: 'not-an-origin',
      }),
    ).toThrow('Invalid environment');
  });

  it('keeps worker configuration independent from HTTP settings', () => {
    expect(
      parseWorkerEnvironment({
        ...sharedEnvironment,
        WORKER_LEASE_MS: '30000',
        WORKER_POLL_INTERVAL_MS: '1000',
      }),
    ).toMatchObject({
      WORKER_LEASE_MS: 30_000,
      WORKER_POLL_INTERVAL_MS: 1_000,
    });
  });
});
