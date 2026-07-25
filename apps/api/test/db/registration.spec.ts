import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';

import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { LoginService } from '../../src/modules/accounts/application/login.service';
import { ReadSessionService } from '../../src/modules/accounts/application/read-session.service';
import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { RequestEmailVerificationService } from '../../src/modules/accounts/application/request-email-verification.service';
import { VerifyEmailService } from '../../src/modules/accounts/application/verify-email.service';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { PrismaService } from '../../src/platform/database/prisma.service';

describe('registration persistence', () => {
  let container: StartedPostgreSqlContainer;
  let csrf: CsrfService;
  let login: LoginService;
  let prisma: PrismaService;
  let registration: RegisterAccountService;
  let repository: AccountsRepository;
  let readSession: ReadSessionService;
  let requestVerification: RequestEmailVerificationService;
  let security: AuthSecurityService;
  let verification: VerifyEmailService;

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
    repository = new AccountsRepository(prisma);
    security = new AuthSecurityService();
    csrf = new CsrfService(repository, security);
    login = new LoginService(repository, security);
    readSession = new ReadSessionService(repository, security);
    registration = new RegisterAccountService(repository, security);
    requestVerification = new RequestEmailVerificationService(repository, security);
    verification = new VerifyEmailService(repository, security);
  });

  beforeEach(async () => {
    await prisma.authAbuseCounter.deleteMany();
    await prisma.anonymousAuthTransaction.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.session.deleteMany();
    await prisma.job.deleteMany();
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

    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    const queued = await prisma.job.findFirstOrThrow();
    expect(queued.payload).toEqual({
      challengeId: challenge.id,
    });
    expect(JSON.stringify(queued.payload)).not.toContain(identity.normalizedEmail);
    expect(JSON.stringify(queued.payload)).not.toContain(
      security.deriveEmailVerificationCode(challenge.id),
    );
  });

  it('stores only HMAC-derived CSRF transaction values', async () => {
    const issued = await csrf.issue();
    const persisted = await prisma.anonymousAuthTransaction.findFirstOrThrow();

    expect(persisted.browserTokenHash).not.toBe(issued.browserToken);
    expect(persisted.csrfTokenHash).not.toBe(issued.csrfToken);
    await expect(csrf.isValid(issued.browserToken, issued.csrfToken)).resolves.toBe(true);
    await expect(csrf.isValid(issued.browserToken, 'wrong-token')).resolves.toBe(false);
  });

  it('activates a pending identity once and replays an identical idempotent request', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    const command = {
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000001',
      networkAddress: '192.0.2.14',
    };

    await expect(verification.execute(command)).resolves.toMatchObject({
      outcome: 'VERIFIED',
    });
    await expect(verification.execute(command)).resolves.toMatchObject({
      outcome: 'REPLAYED',
    });

    const identity = await prisma.authenticationIdentity.findFirstOrThrow();
    expect(identity.verificationState).toBe('ACTIVE');
    expect(identity.verifiedAt).toEqual(expect.any(Date));
    expect((await prisma.emailVerificationChallenge.findFirstOrThrow()).consumedAt).toEqual(
      expect.any(Date),
    );
    expect(await prisma.idempotencyRecord.count()).toBe(1);
  });

  it('invalidates earlier unused codes when a new verification email is requested', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const original = await prisma.emailVerificationChallenge.findFirstOrThrow();
    const originalCode = security.deriveEmailVerificationCode(original.id);

    await expect(
      requestVerification.execute({
        email: 'user@example.com',
        networkAddress: '192.0.2.14',
      }),
    ).resolves.toEqual({
      outcome: 'ACCEPTED',
    });

    expect(await prisma.emailVerificationChallenge.count()).toBe(2);
    await expect(
      prisma.emailVerificationChallenge.findUniqueOrThrow({
        where: {
          id: original.id,
        },
      }),
    ).resolves.toMatchObject({
      invalidatedAt: expect.any(Date),
    });
    const replacement = await prisma.emailVerificationChallenge.findFirstOrThrow({
      where: {
        id: {
          not: original.id,
        },
      },
    });

    const invalidatedCommand = {
      code: originalCode,
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000002',
      networkAddress: '192.0.2.14',
    };
    await expect(verification.execute(invalidatedCommand)).resolves.toEqual({
      outcome: 'INVALID_OR_EXPIRED',
    });
    await expect(verification.execute(invalidatedCommand)).resolves.toEqual({
      outcome: 'INVALID_OR_EXPIRED',
    });
    await expect(
      verification.execute({
        code: security.deriveEmailVerificationCode(replacement.id),
        email: 'user@example.com',
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000003',
        networkAddress: '192.0.2.14',
      }),
    ).resolves.toMatchObject({
      outcome: 'VERIFIED',
    });
  });

  it('leaves only one usable challenge after concurrent resend requests', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });

    await Promise.all([
      requestVerification.execute({
        email: 'user@example.com',
        networkAddress: '192.0.2.14',
      }),
      requestVerification.execute({
        email: 'user@example.com',
        networkAddress: '192.0.2.15',
      }),
    ]);

    const challenges = await prisma.emailVerificationChallenge.findMany();
    const usableChallenges = challenges.filter(
      (challenge) => challenge.consumedAt === null && challenge.invalidatedAt === null,
    );

    expect(challenges).toHaveLength(3);
    expect(usableChallenges).toHaveLength(1);
    expect(await prisma.job.count()).toBe(3);
  });

  it('authenticates only an active verified identity and persists only the session hash', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000091',
      networkAddress: '192.0.2.14',
    });

    const result = await login.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
      returnTo: '/app/today',
    });

    expect(result).toMatchObject({
      next: '/app/today',
      outcome: 'AUTHENTICATED',
      primaryEmail: 'user@example.com',
    });
    if (result.outcome !== 'AUTHENTICATED') {
      throw new Error('Expected authenticated result.');
    }

    const persisted = await prisma.session.findFirstOrThrow();
    expect(persisted.tokenHash).not.toBe(result.sessionToken);
    expect(persisted.tokenHash).toBe(security.hashSecret(result.sessionToken, 'session-storage'));
    await expect(readSession.execute(result.sessionToken)).resolves.toMatchObject({
      authenticated: true,
      primaryEmail: 'user@example.com',
    });
  });

  it('rotates an existing token and keeps at most five active sessions', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000092',
      networkAddress: '192.0.2.14',
    });
    const user = await prisma.user.findFirstOrThrow();
    const now = new Date();

    for (let index = 0; index < 6; index += 1) {
      const issuedAt = new Date(now.getTime() + index);
      await repository.createLoginSession({
        absoluteExpiresAt: new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1_000),
        idleExpiresAt: new Date(issuedAt.getTime() + 12 * 60 * 60 * 1_000),
        now: issuedAt,
        tokenHash: security.hashSecret(`token-${index}`, 'session-storage'),
        userId: user.id,
      });
    }

    expect(
      await prisma.session.count({
        where: {
          revokedAt: null,
        },
      }),
    ).toBe(5);

    const result = await login.execute({
      email: 'user@example.com',
      networkAddress: '198.51.100.14',
      password: 'correct horse battery staple',
      previousSessionToken: 'token-5',
      returnTo: '/app/today',
    });

    expect(result.outcome).toBe('AUTHENTICATED');
    await expect(
      prisma.session.findUniqueOrThrow({
        where: {
          tokenHash: security.hashSecret('token-5', 'session-storage'),
        },
      }),
    ).resolves.toMatchObject({
      revokedAt: expect.any(Date),
    });
    expect(
      await prisma.session.count({
        where: {
          revokedAt: null,
        },
      }),
    ).toBe(5);
  });
});
