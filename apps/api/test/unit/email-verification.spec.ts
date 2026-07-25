import { describe, expect, it, jest } from '@jest/globals';

import { EmailVerificationJobHandler } from '../../src/modules/accounts/application/email-verification-job.handler';
import type { VerificationEmailDelivery } from '../../src/modules/accounts/application/verification-email-delivery.port';
import type { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import type { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';

describe('email verification delivery', () => {
  it('derives the manual code at delivery time without persisting it in the job', async () => {
    const accounts = {
      findVerificationDelivery: jest
        .fn<AccountsRepository['findVerificationDelivery']>()
        .mockResolvedValue({
          challengeId: 'challenge-id',
          consumedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          invalidatedAt: null,
          normalizedEmail: 'user@example.com',
          recipient: 'User@example.com',
        }),
    };
    const security = {
      deriveEmailVerificationCode: jest
        .fn<AuthSecurityService['deriveEmailVerificationCode']>()
        .mockReturnValue('12345678'),
    };
    const delivery = {
      send: jest.fn<VerificationEmailDelivery['send']>().mockResolvedValue(),
    };
    const handler = new EmailVerificationJobHandler(
      accounts as unknown as AccountsRepository,
      security as unknown as AuthSecurityService,
      delivery,
    );

    await handler.handle('challenge-id');

    expect(delivery.send).toHaveBeenCalledWith({
      code: '12345678',
      recipient: 'User@example.com',
      verificationPageUrl: '/verify-email',
    });
  });

  it.each([
    {
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      invalidatedAt: null,
    },
    {
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      invalidatedAt: new Date(),
    },
    {
      consumedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      invalidatedAt: null,
    },
  ])('does not send an unusable challenge', async (state) => {
    const accounts = {
      findVerificationDelivery: jest
        .fn<AccountsRepository['findVerificationDelivery']>()
        .mockResolvedValue({
          challengeId: 'challenge-id',
          normalizedEmail: 'user@example.com',
          recipient: 'User@example.com',
          ...state,
        }),
    };
    const security = {
      deriveEmailVerificationCode: jest.fn(),
    };
    const delivery = {
      send: jest.fn<VerificationEmailDelivery['send']>(),
    };
    const handler = new EmailVerificationJobHandler(
      accounts as unknown as AccountsRepository,
      security as unknown as AuthSecurityService,
      delivery,
    );

    await handler.handle('challenge-id');

    expect(delivery.send).not.toHaveBeenCalled();
    expect(security.deriveEmailVerificationCode).not.toHaveBeenCalled();
  });
});
