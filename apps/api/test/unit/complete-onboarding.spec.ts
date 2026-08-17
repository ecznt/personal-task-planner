import { describe, expect, it, jest } from '@jest/globals';

import { CompleteOnboardingService } from '../../src/modules/accounts/application/complete-onboarding.service';
import type {
  AccountsRepository,
  CurrentUserProfile,
} from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';

const profile: CurrentUserProfile = {
  accountLifecycleState: 'ACTIVE',
  inAppReminderNotificationsEnabled: true,
  normalizedPrimaryEmail: 'user@example.com',
  onboardingCompletedAt: null,
  onboardingState: 'PENDING',
  primaryEmail: 'user@example.com',
  timeZone: 'Europe/Istanbul',
  userId: '018f9f7c-0000-7000-8000-000000000001',
  version: 4,
};

describe('complete onboarding', () => {
  it('requires a session and current User ETag before completing onboarding', async () => {
    const service = new CompleteOnboardingService(repositoryMock(), securityMock());

    await expect(
      service.execute({
        choice: 'START_EMPTY',
        etag: '"etag"',
        idempotencyKey: 'idem-key',
        sessionToken: undefined,
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_REQUIRED',
    });
    await expect(
      service.execute({
        choice: 'START_EMPTY',
        etag: undefined,
        idempotencyKey: 'idem-key',
        sessionToken: 'raw-session-token',
      }),
    ).resolves.toEqual({
      outcome: 'PRECONDITION_REQUIRED',
    });
  });

  it('replays a completed idempotent onboarding request before mutating', async () => {
    const replay = {
      completion: {
        choice: 'START_EMPTY',
        completedAt: new Date('2026-08-17T09:00:00.000Z'),
        next: '/app/today',
        profile: {
          ...profile,
          onboardingCompletedAt: new Date('2026-08-17T09:00:00.000Z'),
          onboardingState: 'COMPLETED',
          version: 5,
        },
        status: 'COMPLETED',
      },
      outcome: 'REPLAYED',
    } as const;
    const accounts = repositoryMock({
      findOnboardingCompletionIdempotencyReplay: jest
        .fn<AccountsRepository['findOnboardingCompletionIdempotencyReplay']>()
        .mockResolvedValue(replay),
    });
    const service = new CompleteOnboardingService(accounts, securityMock());

    await expect(
      service.execute({
        choice: 'START_EMPTY',
        etag: '"stale-or-missing-does-not-matter-for-replay"',
        idempotencyKey: 'idem-key',
        sessionToken: undefined,
      }),
    ).resolves.toEqual(replay);
    expect(accounts.completeStartEmptyOnboarding).not.toHaveBeenCalled();
  });

  it('rejects stale ETags without completing onboarding', async () => {
    const accounts = repositoryMock({
      findCurrentUserProfileBySession: jest
        .fn<AccountsRepository['findCurrentUserProfileBySession']>()
        .mockResolvedValue(profile),
    });
    const service = new CompleteOnboardingService(accounts, securityMock());

    await expect(
      service.execute({
        choice: 'START_EMPTY',
        etag: '"stale-etag"',
        idempotencyKey: 'idem-key',
        sessionToken: 'raw-session-token',
      }),
    ).resolves.toEqual({
      outcome: 'PRECONDITION_FAILED',
    });
    expect(accounts.completeStartEmptyOnboarding).not.toHaveBeenCalled();
  });

  it('completes start-empty onboarding and returns a fresh ETag source profile', async () => {
    const completedAt = new Date('2026-08-17T09:00:00.000Z');
    const accounts = repositoryMock({
      completeStartEmptyOnboarding: jest
        .fn<AccountsRepository['completeStartEmptyOnboarding']>()
        .mockResolvedValue({
          completion: {
            choice: 'START_EMPTY',
            completedAt,
            next: '/app/today',
            profile: {
              ...profile,
              onboardingCompletedAt: completedAt,
              onboardingState: 'COMPLETED',
              version: 5,
            },
            status: 'COMPLETED',
          },
          outcome: 'COMPLETED',
        }),
      findCurrentUserProfileBySession: jest
        .fn<AccountsRepository['findCurrentUserProfileBySession']>()
        .mockResolvedValue(profile),
    });
    const service = new CompleteOnboardingService(accounts, securityMock());

    await expect(
      service.execute({
        choice: 'START_EMPTY',
        etag: etagForVersion(4),
        idempotencyKey: 'idem-key',
        sessionToken: 'raw-session-token',
      }),
    ).resolves.toMatchObject({
      completion: {
        next: '/app/today',
        profile: {
          onboardingState: 'COMPLETED',
          version: 5,
        },
      },
      outcome: 'COMPLETED',
    });
    expect(accounts.completeStartEmptyOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedUserVersion: 4,
      }),
    );
  });
});

function etagForVersion(version: number): string {
  return `"user-profile-etag:018f9f7c-0000-7000-8000-000000000001\0${version}"`;
}

function repositoryMock(overrides: Partial<AccountsRepository> = {}): AccountsRepository {
  return {
    completeStartEmptyOnboarding: jest.fn<AccountsRepository['completeStartEmptyOnboarding']>(),
    findCurrentUserProfileBySession: jest
      .fn<AccountsRepository['findCurrentUserProfileBySession']>()
      .mockResolvedValue(null),
    findOnboardingCompletionIdempotencyReplay: jest
      .fn<AccountsRepository['findOnboardingCompletionIdempotencyReplay']>()
      .mockResolvedValue(null),
    ...overrides,
  } as unknown as AccountsRepository;
}

function securityMock(): AuthSecurityService {
  return {
    createIdentifier: jest.fn<AuthSecurityService['createIdentifier']>().mockReturnValue('new-id'),
    hashSecret: jest
      .fn<AuthSecurityService['hashSecret']>()
      .mockImplementation((value, purpose) => `${purpose}:${value}`),
  } as unknown as AuthSecurityService;
}
