import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository, type CurrentUserProfile } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { SESSION_IDLE_MILLISECONDS } from './login.service';

const sessionRefreshIntervalMilliseconds = 5 * 60 * 1_000;

export type CurrentUserState =
  | {
      readonly authenticated: false;
    }
  | {
      readonly authenticated: true;
      readonly etag: string;
      readonly profile: CurrentUserProfile;
    };

@Injectable()
export class ReadCurrentUserService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(sessionToken: string | undefined): Promise<CurrentUserState> {
    if (sessionToken === undefined) {
      return {
        authenticated: false,
      };
    }

    const now = new Date();
    const profile = await this.accounts.findCurrentUserProfileBySession({
      now,
      refreshAfter: new Date(now.getTime() - sessionRefreshIntervalMilliseconds),
      refreshedIdleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MILLISECONDS),
      tokenHash: this.security.hashSecret(sessionToken, 'session-storage'),
    });

    if (profile === null) {
      return {
        authenticated: false,
      };
    }

    return {
      authenticated: true,
      etag: `"${this.security.hashSecret(`${profile.userId}\0${profile.version}`, 'user-profile-etag')}"`,
      profile,
    };
  }
}
