import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';

import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { PrismaService } from '../../src/platform/database/prisma.service';

describe('registration persistence', () => {
  let container: StartedPostgreSqlContainer;
  let csrf: CsrfService;
  let prisma: PrismaService;
  let registration: RegisterAccountService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18.3-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.NODE_ENV = 'test';

    const migration = spawnSync('pnpm', ['--filter', '@planner/api', 'prisma:migrate:deploy'], {
      cwd: resolve(__dirname, '../../../..'),
      encoding: 'utf8',
      env: process.env,
    });

    if (migration.status !== 0) {
      throw new Error(`Migration failed: ${migration.stderr || migration.stdout}`);
    }

    prisma = new PrismaService();
    await prisma.$connect();
    const repository = new AccountsRepository(prisma);
    const security = new AuthSecurityService();
    csrf = new CsrfService(repository, security);
    registration = new RegisterAccountService(repository, security);
  });

  beforeEach(async () => {
    await prisma.authAbuseCounter.deleteMany();
    await prisma.anonymousAuthTransaction.deleteMany();
    await prisma.emailVerificationChallenge.deleteMany();
    await prisma.authenticationIdentity.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('creates one pending identity and challenge under concurrent normalized duplicates', async () => {
    const command = {
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    };
    const [first, second] = await Promise.all([
      registration.execute({
        ...command,
        email: 'User@Example.com',
      }),
      registration.execute({
        ...command,
        email: ' user@example.COM ',
      }),
    ]);

    expect(first).toEqual({
      outcome: 'ACCEPTED',
    });
    expect(second).toEqual(first);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.authenticationIdentity.count()).toBe(1);
    expect(await prisma.emailVerificationChallenge.count()).toBe(1);

    const identity = await prisma.authenticationIdentity.findFirstOrThrow();
    expect(identity.normalizedEmail).toBe('user@example.com');
    expect(identity.verificationState).toBe('PENDING');
    expect(identity.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(identity.passwordHash).not.toContain(command.password);
  });

  it('stores only HMAC-derived CSRF transaction values', async () => {
    const issued = await csrf.issue();
    const persisted = await prisma.anonymousAuthTransaction.findFirstOrThrow();

    expect(persisted.browserTokenHash).not.toBe(issued.browserToken);
    expect(persisted.csrfTokenHash).not.toBe(issued.csrfToken);
    await expect(csrf.isValid(issued.browserToken, issued.csrfToken)).resolves.toBe(true);
    await expect(csrf.isValid(issued.browserToken, 'wrong-token')).resolves.toBe(false);
  });
});
