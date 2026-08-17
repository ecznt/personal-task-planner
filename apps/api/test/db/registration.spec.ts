import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';

import { CompleteOnboardingService } from '../../src/modules/accounts/application/complete-onboarding.service';
import { CsrfService } from '../../src/modules/accounts/application/csrf.service';
import { InitiateAccountDeletionService } from '../../src/modules/accounts/application/initiate-account-deletion.service';
import { LoginService } from '../../src/modules/accounts/application/login.service';
import { LogoutService } from '../../src/modules/accounts/application/logout.service';
import { ReauthenticateService } from '../../src/modules/accounts/application/reauthenticate.service';
import { ReadSessionService } from '../../src/modules/accounts/application/read-session.service';
import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { RequestEmailVerificationService } from '../../src/modules/accounts/application/request-email-verification.service';
import { RequestPasswordResetService } from '../../src/modules/accounts/application/request-password-reset.service';
import { ResetPasswordService } from '../../src/modules/accounts/application/reset-password.service';
import { VerifyEmailService } from '../../src/modules/accounts/application/verify-email.service';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { PrismaService } from '../../src/platform/database/prisma.service';

describe('registration persistence', () => {
  let container: StartedPostgreSqlContainer;
  let completeOnboarding: CompleteOnboardingService;
  let csrf: CsrfService;
  let initiateAccountDeletion: InitiateAccountDeletionService;
  let login: LoginService;
  let logout: LogoutService;
  let prisma: PrismaService;
  let registration: RegisterAccountService;
  let repository: AccountsRepository;
  let readSession: ReadSessionService;
  let reauthenticate: ReauthenticateService;
  let requestVerification: RequestEmailVerificationService;
  let requestPasswordReset: RequestPasswordResetService;
  let resetPassword: ResetPasswordService;
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
    completeOnboarding = new CompleteOnboardingService(repository, security);
    csrf = new CsrfService(repository, security);
    initiateAccountDeletion = new InitiateAccountDeletionService(repository, security);
    login = new LoginService(repository, security);
    logout = new LogoutService(repository, security);
    reauthenticate = new ReauthenticateService(repository, security);
    readSession = new ReadSessionService(repository, security);
    registration = new RegisterAccountService(repository, security);
    requestVerification = new RequestEmailVerificationService(repository, security);
    requestPasswordReset = new RequestPasswordResetService(repository, security);
    resetPassword = new ResetPasswordService(repository, security);
    verification = new VerifyEmailService(repository, security);
  });

  beforeEach(async () => {
    await prisma.authAbuseCounter.deleteMany();
    await prisma.anonymousAuthTransaction.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.accountDeletionProcess.deleteMany();
    await prisma.reauthenticationProof.deleteMany();
    await prisma.session.deleteMany();
    await prisma.job.deleteMany();
    await prisma.checklistItem.deleteMany();
    await prisma.taskLabel.deleteMany();
    await prisma.task.deleteMany();
    await prisma.label.deleteMany();
    await prisma.project.deleteMany();
    await prisma.areaStatus.deleteMany();
    await prisma.area.deleteMany();
    await prisma.passwordResetChallenge.deleteMany();
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

  it('reads the current user profile only from a valid active session', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000094',
      networkAddress: '192.0.2.14',
    });
    const result = await login.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
      returnTo: '/app/today',
    });

    expect(result.outcome).toBe('AUTHENTICATED');
    if (result.outcome !== 'AUTHENTICATED') {
      throw new Error('Expected authenticated result.');
    }

    await expect(
      repository.findCurrentUserProfileBySession({
        now: new Date(),
        refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
        refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
        tokenHash: security.hashSecret(result.sessionToken, 'session-storage'),
      }),
    ).resolves.toMatchObject({
      accountLifecycleState: 'ACTIVE',
      inAppReminderNotificationsEnabled: true,
      normalizedPrimaryEmail: 'user@example.com',
      onboardingCompletedAt: null,
      onboardingState: 'PENDING',
      primaryEmail: 'user@example.com',
      timeZone: 'UTC',
      version: 1,
    });

    await logout.execute(result.sessionToken);

    await expect(
      repository.findCurrentUserProfileBySession({
        now: new Date(),
        refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
        refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
        tokenHash: security.hashSecret(result.sessionToken, 'session-storage'),
      }),
    ).resolves.toBeNull();
  });

  it('completes start-empty onboarding idempotently without creating planning data', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000104',
      networkAddress: '192.0.2.14',
    });
    const loginResult = await login.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
      returnTo: '/app/onboarding',
    });

    expect(loginResult.outcome).toBe('AUTHENTICATED');
    if (loginResult.outcome !== 'AUTHENTICATED') {
      throw new Error('Expected authenticated result.');
    }

    const current = await repository.findCurrentUserProfileBySession({
      now: new Date(),
      refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
      refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
      tokenHash: security.hashSecret(loginResult.sessionToken, 'session-storage'),
    });

    expect(current).not.toBeNull();
    if (current === null) {
      throw new Error('Expected current profile.');
    }

    const command = {
      choice: 'START_EMPTY' as const,
      etag: completeOnboarding.etagFor(current),
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000105',
      sessionToken: loginResult.sessionToken,
    };

    await expect(completeOnboarding.execute(command)).resolves.toMatchObject({
      completion: {
        next: '/app/today',
        profile: {
          onboardingState: 'COMPLETED',
        },
      },
      outcome: 'COMPLETED',
    });
    await expect(completeOnboarding.execute(command)).resolves.toMatchObject({
      completion: {
        next: '/app/today',
      },
      outcome: 'REPLAYED',
    });

    await expect(prisma.user.findFirstOrThrow()).resolves.toMatchObject({
      onboardingCompletedAt: expect.any(Date),
      onboardingState: 'COMPLETED',
    });
    expect(await prisma.area.count()).toBe(0);
    expect(await prisma.task.count()).toBe(0);
    expect(await prisma.idempotencyRecord.count()).toBe(2);
    expect(await prisma.job.count()).toBe(1);
  });

  it('creates private sample onboarding data atomically and idempotently', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000106',
      networkAddress: '192.0.2.14',
    });
    const loginResult = await login.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
      returnTo: '/app/onboarding',
    });

    expect(loginResult.outcome).toBe('AUTHENTICATED');
    if (loginResult.outcome !== 'AUTHENTICATED') {
      throw new Error('Expected authenticated result.');
    }

    const current = await repository.findCurrentUserProfileBySession({
      now: new Date(),
      refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
      refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
      tokenHash: security.hashSecret(loginResult.sessionToken, 'session-storage'),
    });

    expect(current).not.toBeNull();
    if (current === null) {
      throw new Error('Expected current profile.');
    }

    const command = {
      choice: 'CREATE_SAMPLE_DATA' as const,
      etag: completeOnboarding.etagFor(current),
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000107',
      sessionToken: loginResult.sessionToken,
    };

    await expect(completeOnboarding.execute(command)).resolves.toMatchObject({
      completion: {
        choice: 'CREATE_SAMPLE_DATA',
        next: '/app/today',
        profile: {
          onboardingState: 'COMPLETED',
        },
      },
      outcome: 'COMPLETED',
    });
    await expect(completeOnboarding.execute(command)).resolves.toMatchObject({
      completion: {
        choice: 'CREATE_SAMPLE_DATA',
        next: '/app/today',
      },
      outcome: 'REPLAYED',
    });

    const user = await prisma.user.findFirstOrThrow();
    const area = await prisma.area.findFirstOrThrow({
      include: {
        statuses: true,
      },
    });
    const project = await prisma.project.findFirstOrThrow();
    const tasks = await prisma.task.findMany({
      orderBy: {
        globalRank: 'asc',
      },
    });

    expect(user).toMatchObject({
      onboardingCompletedAt: expect.any(Date),
      onboardingState: 'COMPLETED',
    });
    expect(area).toMatchObject({
      name: 'Kişisel Planlama',
      userId: user.id,
    });
    expect(area.statuses).toHaveLength(3);
    expect(area.statuses.map((status) => status.canonicalStatus).sort()).toEqual([
      'COMPLETED',
      'IN_PROGRESS',
      'TO_DO',
    ]);
    expect(project).toMatchObject({
      areaId: area.id,
      userId: user.id,
    });
    expect(tasks).toHaveLength(3);
    expect(tasks.every((task) => task.userId === user.id && task.areaId === area.id)).toBe(true);
    expect(tasks.filter((task) => task.projectId === project.id)).toHaveLength(2);
    expect(await prisma.label.count()).toBe(1);
    expect(await prisma.taskLabel.count()).toBe(2);
    expect(await prisma.checklistItem.count()).toBe(3);
    expect(await prisma.idempotencyRecord.count()).toBe(2);
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

  it('revokes only the current session and treats a replay as successful', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(challenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000093',
      networkAddress: '192.0.2.14',
    });
    const user = await prisma.user.findFirstOrThrow();
    const now = new Date();

    for (const token of ['current-token', 'other-token']) {
      await repository.createLoginSession({
        absoluteExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000),
        idleExpiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1_000),
        now,
        tokenHash: security.hashSecret(token, 'session-storage'),
        userId: user.id,
      });
    }

    await logout.execute('current-token');
    await logout.execute('current-token');

    await expect(
      prisma.session.findUniqueOrThrow({
        where: {
          tokenHash: security.hashSecret('current-token', 'session-storage'),
        },
      }),
    ).resolves.toMatchObject({
      revokedAt: expect.any(Date),
    });
    await expect(
      prisma.session.findUniqueOrThrow({
        where: {
          tokenHash: security.hashSecret('other-token', 'session-storage'),
        },
      }),
    ).resolves.toMatchObject({
      revokedAt: null,
    });
  });

  it('resets a verified account password once and revokes all active sessions', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const emailChallenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(emailChallenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000101',
      networkAddress: '192.0.2.14',
    });
    const user = await prisma.user.findFirstOrThrow();
    const now = new Date();

    for (const token of ['first-session-token', 'second-session-token']) {
      await repository.createLoginSession({
        absoluteExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000),
        idleExpiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1_000),
        now,
        tokenHash: security.hashSecret(token, 'session-storage'),
        userId: user.id,
      });
    }

    await expect(
      requestPasswordReset.execute({
        email: 'USER@example.com',
        networkAddress: '198.51.100.14',
      }),
    ).resolves.toEqual({
      outcome: 'ACCEPTED',
    });

    const resetChallenge = await prisma.passwordResetChallenge.findFirstOrThrow();
    const rawResetToken = security.derivePasswordResetToken(resetChallenge.id);

    expect(
      JSON.stringify((await prisma.job.findFirstOrThrow({ orderBy: { id: 'desc' } })).payload),
    ).not.toContain(rawResetToken);

    await expect(
      resetPassword.execute({
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000102',
        networkAddress: '198.51.100.14',
        password: 'changed horse battery staple',
        token: rawResetToken,
      }),
    ).resolves.toEqual({
      outcome: 'RESET',
    });
    await expect(
      resetPassword.execute({
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000102',
        networkAddress: '198.51.100.14',
        password: 'changed horse battery staple',
        token: rawResetToken,
      }),
    ).resolves.toEqual({
      outcome: 'REPLAYED',
    });
    await expect(
      resetPassword.execute({
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000103',
        networkAddress: '198.51.100.14',
        password: 'another horse battery staple',
        token: rawResetToken,
      }),
    ).resolves.toEqual({
      outcome: 'INVALID_OR_EXPIRED',
    });

    await expect(
      login.execute({
        email: 'user@example.com',
        networkAddress: '198.51.100.14',
        password: 'correct horse battery staple',
        returnTo: '/app/today',
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_FAILED',
    });
    await expect(
      login.execute({
        email: 'user@example.com',
        networkAddress: '198.51.100.14',
        password: 'changed horse battery staple',
        returnTo: '/app/today',
      }),
    ).resolves.toMatchObject({
      outcome: 'AUTHENTICATED',
    });
    expect(
      await prisma.session.count({
        where: {
          revokedAt: null,
          tokenHash: {
            in: [
              security.hashSecret('first-session-token', 'session-storage'),
              security.hashSecret('second-session-token', 'session-storage'),
            ],
          },
        },
      }),
    ).toBe(0);
  });

  it('initiates account deletion after recent reauthentication and revokes all access', async () => {
    await registration.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.14',
      password: 'correct horse battery staple',
    });
    const emailChallenge = await prisma.emailVerificationChallenge.findFirstOrThrow();
    await verification.execute({
      code: security.deriveEmailVerificationCode(emailChallenge.id),
      email: 'user@example.com',
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000111',
      networkAddress: '192.0.2.14',
    });
    const loginResult = await login.execute({
      email: 'user@example.com',
      networkAddress: '198.51.100.14',
      password: 'correct horse battery staple',
      returnTo: '/app/today',
    });

    expect(loginResult.outcome).toBe('AUTHENTICATED');
    if (loginResult.outcome !== 'AUTHENTICATED') {
      throw new Error('Expected authenticated result.');
    }

    await expect(
      initiateAccountDeletion.execute({
        confirmation: 'DELETE_MY_ACCOUNT',
        etag: '"stale-etag"',
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000112',
        sessionToken: loginResult.sessionToken,
      }),
    ).resolves.toEqual({
      outcome: 'PRECONDITION_FAILED',
    });

    await expect(
      reauthenticate.execute({
        action: 'ACCOUNT_DELETION',
        networkAddress: '198.51.100.14',
        password: 'wrong horse battery staple',
        sessionToken: loginResult.sessionToken,
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_FAILED',
    });
    await expect(
      reauthenticate.execute({
        action: 'ACCOUNT_DELETION',
        networkAddress: '198.51.100.14',
        password: 'correct horse battery staple',
        sessionToken: loginResult.sessionToken,
      }),
    ).resolves.toMatchObject({
      action: 'ACCOUNT_DELETION',
      outcome: 'REAUTHENTICATED',
    });

    const profile = await repository.findCurrentUserProfileBySession({
      now: new Date(),
      refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
      refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
      tokenHash: security.hashSecret(loginResult.sessionToken, 'session-storage'),
    });

    expect(profile).not.toBeNull();
    if (profile === null) {
      throw new Error('Expected current user profile.');
    }

    const etag = `"${security.hashSecret(`${profile.userId}\0${profile.version}`, 'user-profile-etag')}"`;
    const accepted = await initiateAccountDeletion.execute({
      confirmation: 'DELETE_MY_ACCOUNT',
      etag,
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000113',
      sessionToken: loginResult.sessionToken,
    });

    expect(accepted).toMatchObject({
      outcome: 'ACCEPTED',
      process: {
        state: 'PENDING_PRIMARY_PURGE',
      },
    });
    expect(await prisma.accountDeletionProcess.count()).toBe(1);
    expect(await prisma.reauthenticationProof.count({ where: { consumedAt: null } })).toBe(0);
    await expect(prisma.user.findFirstOrThrow()).resolves.toMatchObject({
      accessRevokedAt: expect.any(Date),
      accountLifecycleState: 'DELETION_CONFIRMED',
      deletionConfirmedAt: expect.any(Date),
      version: profile.version + 1,
    });
    expect(await prisma.session.count({ where: { revokedAt: null } })).toBe(0);
    await expect(readSession.execute(loginResult.sessionToken)).resolves.toEqual({
      authenticated: false,
    });
    await expect(
      repository.findCurrentUserProfileBySession({
        now: new Date(),
        refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
        refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
        tokenHash: security.hashSecret(loginResult.sessionToken, 'session-storage'),
      }),
    ).resolves.toBeNull();
    await expect(
      login.execute({
        email: 'user@example.com',
        networkAddress: '198.51.100.14',
        password: 'correct horse battery staple',
        returnTo: '/app/today',
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_FAILED',
    });

    const replayed = await initiateAccountDeletion.execute({
      confirmation: 'DELETE_MY_ACCOUNT',
      etag,
      idempotencyKey: '018f9f7c-0000-7000-8000-000000000113',
      sessionToken: loginResult.sessionToken,
    });

    expect(replayed).toMatchObject({
      outcome: 'REPLAYED',
      process: {
        state: 'PENDING_PRIMARY_PURGE',
      },
    });
    expect(JSON.stringify(await prisma.accountDeletionProcess.findFirstOrThrow())).not.toContain(
      'user@example.com',
    );
  });
});
