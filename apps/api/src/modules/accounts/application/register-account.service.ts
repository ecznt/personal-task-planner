import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail, toEmailDisplayValue } from '../domain/email';
import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';

export type RegisterAccountCommand = {
  readonly email: string;
  readonly networkAddress: string | undefined;
  readonly password: string;
};

export type RegistrationResult =
  | {
      readonly outcome: 'ACCEPTED';
    }
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class RegisterAccountService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: RegisterAccountCommand): Promise<RegistrationResult> {
    const now = new Date();
    const normalizedEmail = normalizeEmail(command.email);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementRegistrationCounters({
      identityKeyHash: this.security.hashSecret(normalizedEmail, 'registration-identity-limit'),
      networkKeyHash: this.security.hashSecret(networkPrefix, 'registration-network-limit'),
      now,
    });

    if (counters.identityCount > 3 || counters.networkCount > 20) {
      return {
        outcome: 'RATE_LIMITED',
        retryAfterSeconds: secondsUntilNextUtcHour(now),
      };
    }

    const passwordHash = await this.security.hashPassword(command.password);
    const challengeId = this.security.createIdentifier();
    const verificationToken = this.security.deriveEmailVerificationToken(challengeId);

    await this.accounts.createPendingAccount({
      challengeExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1_000),
      challengeId,
      challengeTokenHash: this.security.hashSecret(verificationToken, 'email-verification-storage'),
      emailDisplayValue: toEmailDisplayValue(command.email),
      identityId: this.security.createIdentifier(),
      normalizedEmail,
      passwordHash,
      userId: this.security.createIdentifier(),
    });

    return {
      outcome: 'ACCEPTED',
    };
  }
}

function secondsUntilNextUtcHour(now: Date): number {
  const nextHour = new Date(now);
  nextHour.setUTCMinutes(60, 0, 0);
  return Math.max(1, Math.ceil((nextHour.getTime() - now.getTime()) / 1_000));
}
