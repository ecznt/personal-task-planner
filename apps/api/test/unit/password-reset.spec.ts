import { describe, expect, it, jest } from '@jest/globals';

import { PasswordResetJobHandler } from '../../src/modules/accounts/application/password-reset-job.handler';
import type { PasswordResetEmailDelivery } from '../../src/modules/accounts/application/password-reset-email-delivery.port';
import { RequestPasswordResetService } from '../../src/modules/accounts/application/request-password-reset.service';
import { ResetPasswordService } from '../../src/modules/accounts/application/reset-password.service';
import type { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';

describe('password reset', () => {
  it('requests a challenge without exposing account eligibility', async () => {
    const accounts = repositoryMock({
      replacePasswordResetChallenge: jest
        .fn<AccountsRepository['replacePasswordResetChallenge']>()
        .mockResolvedValue(false),
    });
    const security = securityMock({
      createIdentifier: jest
        .fn<AuthSecurityService['createIdentifier']>()
        .mockReturnValue('challenge-id'),
      derivePasswordResetToken: jest
        .fn<AuthSecurityService['derivePasswordResetToken']>()
        .mockReturnValue('raw-reset-token'),
      hashPasswordResetToken: jest
        .fn<AuthSecurityService['hashPasswordResetToken']>()
        .mockReturnValue('reset-token-hash'),
    });
    const service = new RequestPasswordResetService(accounts, security);

    await expect(
      service.execute({
        email: 'User@Example.com',
        networkAddress: '192.0.2.10',
      }),
    ).resolves.toEqual({
      outcome: 'ACCEPTED',
    });
    expect(accounts.replacePasswordResetChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'challenge-id',
        challengeTokenHash: 'reset-token-hash',
        normalizedEmail: 'user@example.com',
      }),
    );
  });

  it('does not create a challenge after the privacy-safe request limit is exceeded', async () => {
    const accounts = repositoryMock({
      incrementAuthCounters: jest
        .fn<AccountsRepository['incrementAuthCounters']>()
        .mockResolvedValue({
          identityCount: 4,
          networkCount: 4,
        }),
      replacePasswordResetChallenge: jest.fn<AccountsRepository['replacePasswordResetChallenge']>(),
    });
    const service = new RequestPasswordResetService(accounts, securityMock());

    await expect(
      service.execute({
        email: 'user@example.com',
        networkAddress: '192.0.2.10',
      }),
    ).resolves.toMatchObject({
      outcome: 'RATE_LIMITED',
    });
    expect(accounts.replacePasswordResetChallenge).not.toHaveBeenCalled();
  });

  it('hashes the new password only after confirmation rate limits pass', async () => {
    const resetPasswordPersistence = jest
      .fn<AccountsRepository['resetPassword']>()
      .mockResolvedValue({
        outcome: 'RESET',
      });
    const accounts = repositoryMock({
      resetPassword: resetPasswordPersistence,
    });
    const security = securityMock({
      hashPassword: jest
        .fn<AuthSecurityService['hashPassword']>()
        .mockResolvedValue('new-argon2id-hash'),
      hashPasswordResetToken: jest
        .fn<AuthSecurityService['hashPasswordResetToken']>()
        .mockReturnValue('reset-token-hash'),
    });
    const service = new ResetPasswordService(accounts, security);

    await expect(
      service.execute({
        idempotencyKey: '018f9f7c-0000-7000-8000-000000000001',
        networkAddress: '192.0.2.10',
        password: 'a changed password',
        token: 'raw-reset-token',
      }),
    ).resolves.toEqual({
      outcome: 'RESET',
    });
    expect(security.hashPassword).toHaveBeenCalledWith('a changed password');
    expect(resetPasswordPersistence).toHaveBeenCalledWith(
      expect.objectContaining({
        newPasswordHash: 'new-argon2id-hash',
        tokenHash: 'reset-token-hash',
      }),
    );
    expect(JSON.stringify(resetPasswordPersistence.mock.calls)).not.toContain('raw-reset-token');
  });

  it('delivers a fragment-token reset URL by deriving the token at job handling time', async () => {
    const accounts = repositoryMock({
      findPasswordResetDelivery: jest
        .fn<AccountsRepository['findPasswordResetDelivery']>()
        .mockResolvedValue({
          challengeId: 'challenge-id',
          consumedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          invalidatedAt: null,
          recipient: 'User@example.com',
        }),
    });
    const security = securityMock({
      derivePasswordResetToken: jest
        .fn<AuthSecurityService['derivePasswordResetToken']>()
        .mockReturnValue('raw-reset-token'),
    });
    const delivery = {
      send: jest.fn<PasswordResetEmailDelivery['send']>().mockResolvedValue(),
    };
    const handler = new PasswordResetJobHandler(accounts, security, delivery);

    await handler.handle('challenge-id');

    expect(delivery.send).toHaveBeenCalledWith({
      recipient: 'User@example.com',
      resetPageUrl: '/reset-password',
      token: 'raw-reset-token',
    });
  });
});

function repositoryMock(overrides: Partial<AccountsRepository> = {}): AccountsRepository {
  return {
    findPasswordResetDelivery: jest.fn<AccountsRepository['findPasswordResetDelivery']>(),
    incrementAuthCounters: jest
      .fn<AccountsRepository['incrementAuthCounters']>()
      .mockResolvedValue({
        identityCount: 1,
        networkCount: 1,
      }),
    replacePasswordResetChallenge: jest.fn<AccountsRepository['replacePasswordResetChallenge']>(),
    resetPassword: jest.fn<AccountsRepository['resetPassword']>(),
    ...overrides,
  } as unknown as AccountsRepository;
}

function securityMock(overrides: Partial<AuthSecurityService> = {}): AuthSecurityService {
  return {
    createIdentifier: jest
      .fn<AuthSecurityService['createIdentifier']>()
      .mockReturnValue('challenge-id'),
    derivePasswordResetToken: jest
      .fn<AuthSecurityService['derivePasswordResetToken']>()
      .mockReturnValue('raw-reset-token'),
    hashPassword: jest.fn<AuthSecurityService['hashPassword']>().mockResolvedValue('argon2id-hash'),
    hashPasswordResetToken: jest
      .fn<AuthSecurityService['hashPasswordResetToken']>()
      .mockReturnValue('reset-token-hash'),
    hashSecret: jest
      .fn<AuthSecurityService['hashSecret']>()
      .mockImplementation((value, purpose) => `${purpose}:${value}`),
    privacySafeNetworkPrefix: jest
      .fn<AuthSecurityService['privacySafeNetworkPrefix']>()
      .mockReturnValue('192.0.2'),
    ...overrides,
  } as unknown as AuthSecurityService;
}
