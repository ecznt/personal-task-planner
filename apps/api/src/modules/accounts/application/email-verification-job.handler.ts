import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import {
  VERIFICATION_EMAIL_DELIVERY,
  type VerificationEmailDelivery,
} from './verification-email-delivery.port';

@Injectable()
export class EmailVerificationJobHandler {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
    @Inject(VERIFICATION_EMAIL_DELIVERY)
    private readonly delivery: VerificationEmailDelivery,
  ) {}

  async handle(challengeId: string): Promise<void> {
    const challenge = await this.accounts.findVerificationDelivery(challengeId);
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
      code: this.security.deriveEmailVerificationCode(challenge.challengeId),
      recipient: challenge.recipient,
      verificationPageUrl: '/verify-email',
    });
  }
}
