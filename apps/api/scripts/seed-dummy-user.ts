import 'reflect-metadata';

import { resolve } from 'node:path';

/**
 * Seeds a deterministic, login-able dummy account with comprehensive planning
 * test data using the application's own runtime provisioning, mirroring the
 * happy path exercised by the database integration specs:
 *
 *   register → derive verification code → verify email → login → complete
 *   onboarding with CREATE_SAMPLE_DATA.
 *
 * `CREATE_SAMPLE_DATA` provisions the full planning graph (area, three
 * statuses, project, colored label, tasks, task-label links, and checklist
 * items) through the exact same production code path the web app uses on
 * onboarding.
 *
 * The email verification code is derived server-side from the challenge id
 * (HMAC-SHA-256), so no SMTP dispatch is required.
 *
 * Environment is loaded from the repository-root `.env` (gitignored, dev-local)
 * so the account is created against the real dev database with the real
 * AUTH_SECURITY_KEY (ensuring logins work from the running app).
 */
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config({
  path: resolve(__dirname, '../../.env'),
});

process.env.AUTH_SECURITY_KEY ??=
  'development-only-dummy-user-auth-security-key';
process.env.DATABASE_URL ??=
  'postgresql://planner:planner_dev@127.0.0.1:5432/personal_task_planner';
process.env.LOG_LEVEL ??= 'silent';
process.env.NODE_ENV ??= 'development';

import { PrismaService } from '../src/platform/database/prisma.service';
import { AccountsRepository } from '../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../src/modules/accounts/security/auth-security.service';
import { RegisterAccountService } from '../src/modules/accounts/application/register-account.service';
import { VerifyEmailService } from '../src/modules/accounts/application/verify-email.service';
import { LoginService } from '../src/modules/accounts/application/login.service';
import { CompleteOnboardingService } from '../src/modules/accounts/application/complete-onboarding.service';

const EMAIL = 'dummy@example.com';
const PASSWORD = 'correct horse battery staple';
const NETWORK_ADDRESS = '192.0.2.14';

async function seedDummyUser(): Promise<void> {
  const prisma = new PrismaService();
  await prisma.$connect();

  const repository = new AccountsRepository(prisma);
  const security = new AuthSecurityService();
  const registration = new RegisterAccountService(repository, security);
  const verification = new VerifyEmailService(repository, security);
  const login = new LoginService(repository, security);
  const completeOnboarding = new CompleteOnboardingService(repository, security);

  // 1. Register — creates a PENDING identity + email verification challenge.
  const registrationResult = await registration.execute({
    email: EMAIL,
    networkAddress: NETWORK_ADDRESS,
    password: PASSWORD,
  });
  if (registrationResult.outcome === 'RATE_LIMITED') {
    throw new Error(
      `Registration rate limited; retry after ${registrationResult.retryAfterSeconds}s.`,
    );
  }

  // 2. Derive the verification code server-side from the challenge id (no SMTP).
  const challenge = await prisma.emailVerificationChallenge.findFirstOrThrow({
    orderBy: {
      createdAt: 'desc',
    },
  });
  const code = security.deriveEmailVerificationCode(challenge.id);

  // 3. Verify email — identity becomes ACTIVE + VERIFIED, onboarding PENDING.
  const verificationResult = await verification.execute({
    code,
    email: EMAIL,
    idempotencyKey: security.createIdentifier(),
    networkAddress: NETWORK_ADDRESS,
  });
  if (
    verificationResult.outcome !== 'VERIFIED' &&
    verificationResult.outcome !== 'REPLAYED'
  ) {
    throw new Error(`Email verification failed: ${verificationResult.outcome}`);
  }

  // 4. Login — creates a real session (login-able with the known password).
  const loginResult = await login.execute({
    email: EMAIL,
    networkAddress: NETWORK_ADDRESS,
    password: PASSWORD,
    returnTo: '/app/onboarding',
  });
  if (loginResult.outcome !== 'AUTHENTICATED') {
    throw new Error(
      `Login failed with outcome: ${
        loginResult.outcome === 'AUTHENTICATION_FAILED'
          ? 'AUTHENTICATION_FAILED'
          : loginResult.outcome
      }`,
    );
  }

  // 5. Complete onboarding with CREATE_SAMPLE_DATA — provisions the
  //    comprehensive planning graph via the production code path.
  const current = await repository.findCurrentUserProfileBySession({
    now: new Date(),
    refreshAfter: new Date(Date.now() - 5 * 60 * 1_000),
    refreshedIdleExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1_000),
    tokenHash: security.hashSecret(loginResult.sessionToken, 'session-storage'),
  });
  if (current === null) {
    throw new Error('Expected a current profile after login.');
  }

  const completionResult = await completeOnboarding.execute({
    choice: 'CREATE_SAMPLE_DATA',
    etag: completeOnboarding.etagFor(current),
    idempotencyKey: security.createIdentifier(),
    sessionToken: loginResult.sessionToken,
  });
  if (completionResult.outcome !== 'COMPLETED') {
    throw new Error(
      `Onboarding completion failed with outcome: ${completionResult.outcome}`,
    );
  }

  await prisma.$disconnect();

  Logger.log(
    `Dummy user seeded: ${EMAIL} / ${PASSWORD}\n` +
      `Onboarding: ${completionResult.completion.status} (CREATE_SAMPLE_DATA)\n` +
      `Next: ${completionResult.completion.next}`,
    'SeedDummyUser',
  );
}

seedDummyUser().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
