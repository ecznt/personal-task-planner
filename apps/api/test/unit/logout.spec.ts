import { describe, expect, it, jest } from '@jest/globals';

import { LogoutService } from '../../src/modules/accounts/application/logout.service';
import type { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';

describe('logout', () => {
  it('revokes only the purpose-bound hash of the supplied session token', async () => {
    const accounts = {
      revokeSession: jest.fn<AccountsRepository['revokeSession']>().mockResolvedValue(),
    } as unknown as AccountsRepository;
    const security = {
      hashSecret: jest
        .fn<AuthSecurityService['hashSecret']>()
        .mockImplementation((value, purpose) => `${purpose}:${value}`),
    } as unknown as AuthSecurityService;
    const service = new LogoutService(accounts, security);

    await service.execute('raw-session-token');

    expect(accounts.revokeSession).toHaveBeenCalledWith({
      now: expect.any(Date),
      tokenHash: 'session-storage:raw-session-token',
    });
  });

  it('treats an absent session as an idempotent success', async () => {
    const accounts = {
      revokeSession: jest.fn<AccountsRepository['revokeSession']>().mockResolvedValue(),
    } as unknown as AccountsRepository;
    const security = {
      hashSecret: jest.fn<AuthSecurityService['hashSecret']>(),
    } as unknown as AuthSecurityService;
    const service = new LogoutService(accounts, security);

    await expect(service.execute(undefined)).resolves.toBeUndefined();
    expect(accounts.revokeSession).not.toHaveBeenCalled();
    expect(security.hashSecret).not.toHaveBeenCalled();
  });
});
