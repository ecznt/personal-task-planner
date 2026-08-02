import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

const reauthenticationLifetimeMilliseconds = 15 * 60 * 1_000;
const dummyPasswordHash =
  '$argon2id$v=19$m=19456,t=2,p=1$BkCKc4nvUSNMd8z7JTCwHw$Hq3rrwkeSaU0vJfKLVamdKaGPSzWPcIgBl6AGFU7Rms';

export type ReauthenticationCommand = {
  readonly action: 'ACCOUNT_DELETION';
  readonly networkAddress: string | undefined;
  readonly password: string;
  readonly sessionToken: string | undefined;
};

export type ReauthenticationResult =
  | {
      readonly outcome: 'REAUTHENTICATED';
      readonly action: 'ACCOUNT_DELETION';
      readonly expiresAt: Date;
    }
  | {
      readonly outcome: 'AUTHENTICATION_REQUIRED' | 'AUTHENTICATION_FAILED';
    }
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class ReauthenticateService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: ReauthenticationCommand): Promise<ReauthenticationResult> {
    if (command.sessionToken === undefined) {
      await this.security.verifyPassword(dummyPasswordHash, command.password);

      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    const now = new Date();
    const tokenHash = this.security.hashSecret(command.sessionToken, 'session-storage');
    const session = await this.accounts.findReauthenticationSessionByToken({
      now,
      tokenHash,
    });
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'REAUTHENTICATION',
      identityKeyHash: this.security.hashSecret(
        session?.userId ?? tokenHash,
        'reauthentication-identity-limit',
      ),
      networkKeyHash: this.security.hashSecret(networkPrefix, 'reauthentication-network-limit'),
      now,
      windowMinutes: 15,
    });

    if (counters.identityCount > 5 || counters.networkCount > 30) {
      return {
        outcome: 'RATE_LIMITED',
        retryAfterSeconds: secondsUntilWindowEnd(now, 15),
      };
    }

    const passwordMatches = await this.security.verifyPassword(
      session?.passwordHash ?? dummyPasswordHash,
      command.password,
    );

    if (session === null) {
      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    if (!passwordMatches) {
      return {
        outcome: 'AUTHENTICATION_FAILED',
      };
    }

    const expiresAt = new Date(now.getTime() + reauthenticationLifetimeMilliseconds);
    await this.accounts.createReauthenticationProof({
      action: command.action,
      expiresAt,
      now,
      proofId: this.security.createIdentifier(),
      sessionId: session.sessionId,
      userId: session.userId,
    });

    return {
      action: command.action,
      expiresAt,
      outcome: 'REAUTHENTICATED',
    };
  }
}
