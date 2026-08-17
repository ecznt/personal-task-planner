import { describe, expect, it, jest } from '@jest/globals';

import { UpdateCurrentUserService } from '../../src/modules/accounts/application/update-current-user.service';
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
  timeZone: 'UTC',
  userId: '018f9f7c-0000-7000-8000-000000000001',
  version: 3,
};

describe('update current user', () => {
  it('requires a session and current User ETag before updating preferences', async () => {
    const service = new UpdateCurrentUserService(repositoryMock(), securityMock());

    await expect(
      service.execute({
        etag: '"etag"',
        sessionToken: undefined,
        timeZone: 'Europe/Istanbul',
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_REQUIRED',
    });
    await expect(
      service.execute({
        etag: undefined,
        sessionToken: 'raw-session-token',
        timeZone: 'Europe/Istanbul',
      }),
    ).resolves.toEqual({
      outcome: 'PRECONDITION_REQUIRED',
    });
  });

  it('rejects stale ETags without updating the User', async () => {
    const accounts = repositoryMock({
      findCurrentUserProfileBySession: jest
        .fn<AccountsRepository['findCurrentUserProfileBySession']>()
        .mockResolvedValue(profile),
    });
    const service = new UpdateCurrentUserService(accounts, securityMock());

    await expect(
      service.execute({
        etag: '"stale-etag"',
        sessionToken: 'raw-session-token',
        timeZone: 'Europe/Istanbul',
      }),
    ).resolves.toEqual({
      outcome: 'PRECONDITION_FAILED',
    });
    expect(accounts.updateCurrentUserProfile).not.toHaveBeenCalled();
  });

  it('updates only the current User time zone and returns a fresh ETag', async () => {
    const accounts = repositoryMock({
      findCurrentUserProfileBySession: jest
        .fn<AccountsRepository['findCurrentUserProfileBySession']>()
        .mockResolvedValue(profile),
      updateCurrentUserProfile: jest
        .fn<AccountsRepository['updateCurrentUserProfile']>()
        .mockResolvedValue({
          ...profile,
          timeZone: 'Europe/Istanbul',
          version: 4,
        }),
    });
    const service = new UpdateCurrentUserService(accounts, securityMock());

    await expect(
      service.execute({
        etag: etagForVersion(3),
        sessionToken: 'raw-session-token',
        timeZone: 'Europe/Istanbul',
      }),
    ).resolves.toMatchObject({
      etag: etagForVersion(4),
      outcome: 'UPDATED',
      profile: {
        onboardingState: 'PENDING',
        timeZone: 'Europe/Istanbul',
      },
    });
    expect(accounts.updateCurrentUserProfile).toHaveBeenCalledWith({
      expectedUserVersion: 3,
      timeZone: 'Europe/Istanbul',
      userId: '018f9f7c-0000-7000-8000-000000000001',
    });
  });
});

function etagForVersion(version: number): string {
  return `"user-profile-etag:018f9f7c-0000-7000-8000-000000000001\0${version}"`;
}

function repositoryMock(overrides: Partial<AccountsRepository> = {}): AccountsRepository {
  return {
    findCurrentUserProfileBySession: jest
      .fn<AccountsRepository['findCurrentUserProfileBySession']>()
      .mockResolvedValue(null),
    updateCurrentUserProfile: jest.fn<AccountsRepository['updateCurrentUserProfile']>(),
    ...overrides,
  } as unknown as AccountsRepository;
}

function securityMock(): AuthSecurityService {
  return {
    hashSecret: jest
      .fn<AuthSecurityService['hashSecret']>()
      .mockImplementation((value, purpose) => `${purpose}:${value}`),
  } as unknown as AuthSecurityService;
}
