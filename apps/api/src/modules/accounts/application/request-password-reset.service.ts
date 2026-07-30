import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail } from '../domain/email';
import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

export type RequestPasswordResetCommand = {
  readonly email: string;
  readonly networkAddress: string | undefined;
};

export type RequestPasswordResetResult =
  | {
      readonly outcome: 'ACCEPTED';
    }
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class RequestPasswordResetService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<RequestPasswordResetResult> {
    const now = new Date();
    const normalizedEmail = normalizeEmail(command.email);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'PASSWORD_RESET_REQUEST',
      identityKeyHash: this.security.hashSecret(
        normalizedEmail,
        'password-reset-request-identity-limit',
      ),
      networkKeyHash: this.security.hashSecret(
        networkPrefix,
        'password-reset-request-network-limit',
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
    const token = this.security.derivePasswordResetToken(challengeId);

    await this.accounts.replacePasswordResetChallenge({
      challengeExpiresAt: new Date(now.getTime() + 30 * 60 * 1_000),
      challengeId,
      challengeTokenHash: this.security.hashPasswordResetToken(token),
      normalizedEmail,
      now,
    });

    return {
      outcome: 'ACCEPTED',
    };
  }
}
