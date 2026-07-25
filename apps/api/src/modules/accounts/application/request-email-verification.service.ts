import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail } from '../domain/email';
import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

export type RequestEmailVerificationCommand = {
  readonly email: string;
  readonly networkAddress: string | undefined;
};

export type RequestEmailVerificationResult =
  | {
      readonly outcome: 'ACCEPTED';
    }
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class RequestEmailVerificationService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResult> {
    const now = new Date();
    const normalizedEmail = normalizeEmail(command.email);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'EMAIL_VERIFICATION_REQUEST',
      identityKeyHash: this.security.hashSecret(
        normalizedEmail,
        'email-verification-request-identity-limit',
      ),
      networkKeyHash: this.security.hashSecret(
        networkPrefix,
        'email-verification-request-network-limit',
      ),
      now,
      windowMinutes: 60,
    });

    if (counters.identityCount > 3 || counters.networkCount > 20) {
      return {
        outcome: 'RATE_LIMITED',
        retryAfterSeconds: secondsUntilWindowEnd(now, 60),
      };
    }

    const challengeId = this.security.createIdentifier();
    const verificationCode = this.security.deriveEmailVerificationCode(challengeId);

    await this.accounts.replacePendingVerificationChallenge({
      challengeExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1_000),
      challengeId,
      challengeTokenHash: this.security.hashEmailVerificationCode(
        normalizedEmail,
        verificationCode,
      ),
      normalizedEmail,
      now,
    });

    return {
      outcome: 'ACCEPTED',
    };
  }
}
