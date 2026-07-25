import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail } from '../domain/email';
import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { secondsUntilWindowEnd } from './auth-rate-limit';

const dummyPasswordHash =
  '$argon2id$v=19$m=19456,t=2,p=1$BkCKc4nvUSNMd8z7JTCwHw$Hq3rrwkeSaU0vJfKLVamdKaGPSzWPcIgBl6AGFU7Rms';

export const SESSION_IDLE_MILLISECONDS = 12 * 60 * 60 * 1_000;
export const SESSION_ABSOLUTE_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000;

export type LoginCommand = {
  readonly email: string;
  readonly networkAddress: string | undefined;
  readonly password: string;
  readonly previousSessionToken?: string;
  readonly returnTo: string;
};

export type LoginResult =
  | {
      readonly outcome: 'AUTHENTICATED';
      readonly absoluteExpiresAt: Date;
      readonly idleExpiresAt: Date;
      readonly next: string;
      readonly primaryEmail: string;
      readonly sessionToken: string;
    }
  | {
      readonly outcome: 'AUTHENTICATION_FAILED';
    }
  | {
      readonly outcome: 'EMAIL_VERIFICATION_REQUIRED';
    }
  | {
      readonly outcome: 'RATE_LIMITED';
      readonly retryAfterSeconds: number;
    };

@Injectable()
export class LoginService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const now = new Date();
    const normalizedEmail = normalizeEmail(command.email);
    const networkPrefix = this.security.privacySafeNetworkPrefix(command.networkAddress);
    const counters = await this.accounts.incrementAuthCounters({
      action: 'LOGIN',
      identityKeyHash: this.security.hashSecret(normalizedEmail, 'login-identity-limit'),
      networkKeyHash: this.security.hashSecret(networkPrefix, 'login-network-limit'),
      now,
      windowMinutes: 15,
    });

    if (counters.identityCount > 5 || counters.networkCount > 30) {
      return {
        outcome: 'RATE_LIMITED',
        retryAfterSeconds: secondsUntilWindowEnd(now, 15),
      };
    }

    const identity = await this.accounts.findLoginIdentity(normalizedEmail);
    const passwordMatches = await this.security.verifyPassword(
      identity?.passwordHash ?? dummyPasswordHash,
      command.password,
    );

    if (identity === null || !passwordMatches || !identity.enabled || !identity.userIsActive) {
      return {
        outcome: 'AUTHENTICATION_FAILED',
      };
    }

    if (identity.verificationState !== 'ACTIVE') {
      return {
        outcome: 'EMAIL_VERIFICATION_REQUIRED',
      };
    }

    const sessionToken = this.security.createOpaqueToken();
    const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MILLISECONDS);
    const idleExpiresAt = new Date(now.getTime() + SESSION_IDLE_MILLISECONDS);
    const session = await this.accounts.createLoginSession({
      absoluteExpiresAt,
      idleExpiresAt,
      now,
      tokenHash: this.security.hashSecret(sessionToken, 'session-storage'),
      userId: identity.userId,
      ...(command.previousSessionToken === undefined
        ? {}
        : {
            previousTokenHash: this.security.hashSecret(
              command.previousSessionToken,
              'session-storage',
            ),
          }),
    });

    if (session === null) {
      return {
        outcome: 'AUTHENTICATION_FAILED',
      };
    }

    return {
      absoluteExpiresAt: session.absoluteExpiresAt,
      idleExpiresAt: session.idleExpiresAt,
      next: command.returnTo,
      outcome: 'AUTHENTICATED',
      primaryEmail: session.primaryEmail,
      sessionToken,
    };
  }
}
