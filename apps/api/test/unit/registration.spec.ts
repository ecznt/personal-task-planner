import { describe, expect, it, jest } from '@jest/globals';

import { RegisterAccountService } from '../../src/modules/accounts/application/register-account.service';
import { normalizeEmail } from '../../src/modules/accounts/domain/email';
import type { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { parseRegistrationInput } from '../../src/modules/accounts/transport/registration.schema';
import { ApiProblemException } from '../../src/platform/http/api-problem.exception';

describe('email/password registration rules', () => {
  it('normalizes email without provider-specific alias rules', () => {
    expect(normalizeEmail('  USER+plan@Example.COM  ')).toBe('user+plan@example.com');
  });

  it('counts Unicode code points and preserves the password value', () => {
    const password = '🔐'.repeat(12);
    const parsed = parseRegistrationInput({
      email: 'user@example.com',
      password,
      passwordConfirmation: password,
      termsAccepted: true,
    });

    expect(parsed.password).toBe(password);
  });

  it('returns safe field errors without echoing rejected password values', () => {
    const rejectedPassword = 'short-secret';

    expect(() =>
      parseRegistrationInput({
        email: 'not-an-email',
        password: rejectedPassword,
        passwordConfirmation: 'different',
        termsAccepted: false,
      }),
    ).toThrow(ApiProblemException);

    try {
      parseRegistrationInput({
        email: 'not-an-email',
        password: rejectedPassword,
        passwordConfirmation: 'different',
        termsAccepted: false,
      });
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain(rejectedPassword);
    }
  });

  it('returns the same accepted outcome when persistence reports a retained account', async () => {
    const accounts = {
      createPendingAccount: jest.fn<AccountsRepository['createPendingAccount']>(),
      incrementRegistrationCounters: jest.fn<AccountsRepository['incrementRegistrationCounters']>(),
    };
    accounts.incrementRegistrationCounters.mockResolvedValue({
      identityCount: 1,
      networkCount: 1,
    });
    accounts.createPendingAccount.mockResolvedValue('RETAINED');
    const security = {
      createIdentifier: jest
        .fn<AuthSecurityService['createIdentifier']>()
        .mockReturnValueOnce('challenge-id')
        .mockReturnValueOnce('identity-id')
        .mockReturnValueOnce('user-id'),
      deriveEmailVerificationToken: jest
        .fn<AuthSecurityService['deriveEmailVerificationToken']>()
        .mockReturnValue('verification-token'),
      hashPassword: jest
        .fn<AuthSecurityService['hashPassword']>()
        .mockResolvedValue('argon2id-hash'),
      hashSecret: jest
        .fn<AuthSecurityService['hashSecret']>()
        .mockImplementation((value, purpose) => `${purpose}:${value}`),
      privacySafeNetworkPrefix: jest
        .fn<AuthSecurityService['privacySafeNetworkPrefix']>()
        .mockReturnValue('192.0.2'),
    };
    const service = new RegisterAccountService(
      accounts as unknown as AccountsRepository,
      security as unknown as AuthSecurityService,
    );

    await expect(
      service.execute({
        email: 'Retained@Example.com',
        networkAddress: '192.0.2.12',
        password: 'a secure password',
      }),
    ).resolves.toEqual({
      outcome: 'ACCEPTED',
    });
    expect(security.hashPassword).toHaveBeenCalledWith('a secure password');
  });

  it('does not perform password hashing after the privacy-safe rate limit is exceeded', async () => {
    const accounts = {
      createPendingAccount: jest.fn<AccountsRepository['createPendingAccount']>(),
      incrementRegistrationCounters: jest
        .fn<AccountsRepository['incrementRegistrationCounters']>()
        .mockResolvedValue({
          identityCount: 4,
          networkCount: 4,
        }),
    };
    const security = {
      hashPassword: jest.fn<AuthSecurityService['hashPassword']>(),
      hashSecret: jest
        .fn<AuthSecurityService['hashSecret']>()
        .mockImplementation((value, purpose) => `${purpose}:${value}`),
      privacySafeNetworkPrefix: jest
        .fn<AuthSecurityService['privacySafeNetworkPrefix']>()
        .mockReturnValue('192.0.2'),
    };
    const service = new RegisterAccountService(
      accounts as unknown as AccountsRepository,
      security as unknown as AuthSecurityService,
    );

    await expect(
      service.execute({
        email: 'user@example.com',
        networkAddress: '192.0.2.12',
        password: 'a secure password',
      }),
    ).resolves.toMatchObject({
      outcome: 'RATE_LIMITED',
    });
    expect(security.hashPassword).not.toHaveBeenCalled();
    expect(accounts.createPendingAccount).not.toHaveBeenCalled();
  });
});
