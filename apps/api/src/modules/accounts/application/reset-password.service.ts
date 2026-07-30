import { Inject, Injectable } from '@nestjs/common';

import {
  AccountsRepository,
  type ResetPasswordPersistenceResult,
} from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

export type ResetPasswordCommand = {
  readonly idempotencyKey: string;
  readonly networkAddress: string | undefined;
  readonly password: string;
  readonly token: string;
};

export type ResetPasswordResult =
  | ResetPasswordPersistenceResult
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class ResetPasswordService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResult> {
    const now = new Date();
    const tokenHash = this.security.hashPasswordResetToken(command.token);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'PASSWORD_RESET_CONFIRMATION',
      identityKeyHash: this.security.hashSecret(
        tokenHash,
        'password-reset-confirmation-token-limit',
      ),
      networkKeyHash: this.security.hashSecret(
        networkPrefix,
        'password-reset-confirmation-network-limit',
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

    const newPasswordHash = await this.security.hashPassword(command.password);

    return this.accounts.resetPassword({
      idempotencyId: this.security.createIdentifier(),
      idempotencyKeyHash: this.security.hashSecret(
        `POST\0/api/v1/auth/password-resets\0${command.idempotencyKey}`,
        'idempotency-key-storage',
      ),
      newPasswordHash,
      now,
      requestFingerprint: this.security.hashSecret(
        `${tokenHash}\0${command.password}`,
        'password-reset-idempotency-fingerprint',
      ),
      tokenHash,
    });
  }
}
