import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { SESSION_IDLE_MILLISECONDS } from './login.service';

const sessionRefreshIntervalMilliseconds = 5 * 60 * 1_000;

export type SessionState =
  | {
      readonly authenticated: false;
    }
  | {
      readonly absoluteExpiresAt: Date;
      readonly authenticated: true;
      readonly idleExpiresAt: Date;
      readonly primaryEmail: string;
    };

@Injectable()
export class ReadSessionService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(sessionToken: string | undefined): Promise<SessionState> {
    if (sessionToken === undefined) {
      return {
        authenticated: false,
      };
    }

    const now = new Date();
    const session = await this.accounts.findAuthenticatedSession({
      now,
      refreshAfter: new Date(now.getTime() - sessionRefreshIntervalMilliseconds),
      refreshedIdleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MILLISECONDS),
      tokenHash: this.security.hashSecret(sessionToken, 'session-storage'),
    });

    if (session === null) {
      return {
        authenticated: false,
      };
    }

    return {
      absoluteExpiresAt: session.absoluteExpiresAt,
      authenticated: true,
      idleExpiresAt: session.idleExpiresAt,
      primaryEmail: session.primaryEmail,
    };
  }
}
