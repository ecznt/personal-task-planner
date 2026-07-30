import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import {
  RESET_PASSWORD_EMAIL_DELIVERY,
  type PasswordResetEmailDelivery,
} from './password-reset-email-delivery.port';

@Injectable()
export class PasswordResetJobHandler {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
    @Inject(RESET_PASSWORD_EMAIL_DELIVERY)
    private readonly delivery: PasswordResetEmailDelivery,
  ) {}

  async handle(challengeId: string): Promise<void> {
    const challenge = await this.accounts.findPasswordResetDelivery(challengeId);
    const now = new Date();

    if (
      challenge === null ||
      challenge.consumedAt !== null ||
      challenge.invalidatedAt !== null ||
      challenge.expiresAt <= now
    ) {
      return;
    }

    await this.delivery.send({
      recipient: challenge.recipient,
      resetPageUrl: '/reset-password',
      token: this.security.derivePasswordResetToken(challenge.challengeId),
    });
  }
}
