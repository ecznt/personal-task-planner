import { describe, expect, it, jest } from '@jest/globals';

import { LoginService } from '../../src/modules/accounts/application/login.service';
import type { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { safeReturnPath } from '../../src/modules/accounts/transport/session.schema';

describe('login', () => {
  it.each([
    undefined,
    'https://attacker.example/steal',
    '//attacker.example/steal',
    '/login',
    '/app/today#credential',
    '/app/..\\admin',
  ])('falls back from unsafe return intent %p', (returnTo) => {
    expect(safeReturnPath(returnTo)).toBe('/app/today');
  });

  it('preserves a safe authenticated route and query', () => {
    expect(safeReturnPath('/app/areas?view=list')).toBe('/app/areas?view=list');
  });

  it('uses a dummy password verification for an unknown email', async () => {
    const accounts = repositoryMock({
      findLoginIdentity: jest.fn<AccountsRepository['findLoginIdentity']>().mockResolvedValue(null),
    });
    const security = securityMock({
      verifyPassword: jest.fn<AuthSecurityService['verifyPassword']>().mockResolvedValue(false),
    });
    const service = new LoginService(accounts, security);

    await expect(
      service.execute({
        email: 'missing@example.com',
        networkAddress: '192.0.2.10',
        password: 'not-the-password',
        returnTo: '/app/today',
      }),
    ).resolves.toEqual({
      outcome: 'AUTHENTICATION_FAILED',
    });
    expect(security.verifyPassword).toHaveBeenCalledWith(
      expect.stringMatching(/^\$argon2id\$/),
      'not-the-password',
    );
    expect(accounts.createLoginSession).not.toHaveBeenCalled();
  });

  it('reveals verification recovery only after the correct password is proven', async () => {
    const accounts = repositoryMock({
      findLoginIdentity: jest.fn<AccountsRepository['findLoginIdentity']>().mockResolvedValue({
        enabled: true,
        normalizedEmail: 'pending@example.com',
        passwordHash: '$argon2id$stored',
        primaryEmail: 'pending@example.com',
        userId: '018f9f7c-0000-7000-8000-000000000001',
        userIsActive: true,
        verificationState: 'PENDING',
      }),
    });
    const security = securityMock({
      verifyPassword: jest.fn<AuthSecurityService['verifyPassword']>().mockResolvedValue(true),
    });
    const service = new LoginService(accounts, security);

    await expect(
      service.execute({
        email: 'pending@example.com',
        networkAddress: '192.0.2.10',
        password: 'correct password',
        returnTo: '/app/today',
      }),
    ).resolves.toEqual({
      outcome: 'EMAIL_VERIFICATION_REQUIRED',
    });
    expect(accounts.createLoginSession).not.toHaveBeenCalled();
  });

  it('stores only a derived token and returns the raw token only to the cookie boundary', async () => {
    const accounts = repositoryMock({
      createLoginSession: jest.fn<AccountsRepository['createLoginSession']>().mockResolvedValue({
        absoluteExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
        idleExpiresAt: new Date('2026-07-26T12:00:00.000Z'),
        primaryEmail: 'user@example.com',
        userId: '018f9f7c-0000-7000-8000-000000000001',
      }),
      findLoginIdentity: jest.fn<AccountsRepository['findLoginIdentity']>().mockResolvedValue({
        enabled: true,
        normalizedEmail: 'user@example.com',
        passwordHash: '$argon2id$stored',
        primaryEmail: 'user@example.com',
        userId: '018f9f7c-0000-7000-8000-000000000001',
        userIsActive: true,
        verificationState: 'ACTIVE',
      }),
    });
    const security = securityMock({
      createOpaqueToken: jest
        .fn<AuthSecurityService['createOpaqueToken']>()
        .mockReturnValue('raw-session-token'),
      hashSecret: jest
        .fn<AuthSecurityService['hashSecret']>()
        .mockImplementation((value, purpose) => `${purpose}:${value}`),
      verifyPassword: jest.fn<AuthSecurityService['verifyPassword']>().mockResolvedValue(true),
    });
    const service = new LoginService(accounts, security);

    const result = await service.execute({
      email: 'user@example.com',
      networkAddress: '192.0.2.10',
      password: 'correct password',
      returnTo: '/app/areas',
    });

    expect(result).toMatchObject({
      next: '/app/areas',
      outcome: 'AUTHENTICATED',
      sessionToken: 'raw-session-token',
    });
    expect(accounts.createLoginSession).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'session-storage:raw-session-token',
      }),
    );
  });
});

function repositoryMock(overrides: Partial<AccountsRepository> = {}): AccountsRepository {
  return {
    createLoginSession: jest.fn<AccountsRepository['createLoginSession']>(),
    findLoginIdentity: jest.fn<AccountsRepository['findLoginIdentity']>(),
    incrementAuthCounters: jest
      .fn<AccountsRepository['incrementAuthCounters']>()
      .mockResolvedValue({
        identityCount: 1,
        networkCount: 1,
      }),
    ...overrides,
  } as unknown as AccountsRepository;
}

function securityMock(overrides: Partial<AuthSecurityService> = {}): AuthSecurityService {
  return {
    createOpaqueToken: jest
      .fn<AuthSecurityService['createOpaqueToken']>()
      .mockReturnValue('raw-session-token'),
    hashSecret: jest
      .fn<AuthSecurityService['hashSecret']>()
      .mockImplementation((value, purpose) => `${purpose}:${value}`),
    privacySafeNetworkPrefix: jest
      .fn<AuthSecurityService['privacySafeNetworkPrefix']>()
      .mockReturnValue('192.0.2'),
    verifyPassword: jest.fn<AuthSecurityService['verifyPassword']>().mockResolvedValue(false),
    ...overrides,
  } as unknown as AuthSecurityService;
}
