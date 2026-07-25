import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail } from '../domain/email';
import {
  AccountsRepository,
  type VerifyEmailPersistenceResult,
} from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

export type VerifyEmailCommand = {
  readonly code: string;
  readonly email: string;
  readonly idempotencyKey: string;
  readonly networkAddress: string | undefined;
};

export type VerifyEmailResult =
  | VerifyEmailPersistenceResult
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class VerifyEmailService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResult> {
    const now = new Date();
    const normalizedEmail = normalizeEmail(command.email);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'EMAIL_VERIFICATION_CONFIRMATION',
      identityKeyHash: this.security.hashSecret(
        normalizedEmail,
        'email-verification-confirmation-identity-limit',
      ),
      networkKeyHash: this.security.hashSecret(
        networkPrefix,
        'email-verification-confirmation-network-limit',
      ),
      now,
      windowMinutes: 15,
    });

    if (counters.identityCount > 5 || counters.networkCount > 30) {
      return {
        outcome: 'RATE_LIMITED',
        retryAfterSeconds: secondsUntilWindowEnd(now, 15),
      };
    }

    const requestFingerprint = this.security.hashSecret(
      `${normalizedEmail}\0${command.code}`,
      'email-verification-idempotency-fingerprint',
    );

    return this.accounts.verifyEmail({
      idempotencyId: this.security.createIdentifier(),
      idempotencyKeyHash: this.security.hashSecret(
        `POST\0/api/v1/auth/email-verifications\0${command.idempotencyKey}`,
        'idempotency-key-storage',
      ),
      normalizedEmail,
      now,
      requestFingerprint,
      tokenHash: this.security.hashEmailVerificationCode(normalizedEmail, command.code),
    });
  }
}
