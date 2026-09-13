import { Inject, Injectable } from '@nestjs/common';

import { AccountsRepository, type CurrentUserProfile } from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { SESSION_IDLE_MILLISECONDS } from './login.service';

const sessionRefreshIntervalMilliseconds = 5 * 60 * 1_000;

export type UpdateCurrentUserCommand = {
  readonly etag: string | undefined;
  readonly inAppReminderNotificationsEnabled?: boolean | undefined;
  readonly sessionToken: string | undefined;
  readonly timeZone?: string | undefined;
};

export type UpdateCurrentUserResult =
  | {
      readonly outcome: 'UPDATED';
      readonly etag: string;
      readonly profile: CurrentUserProfile;
    }
  | {
      readonly outcome: 'AUTHENTICATION_REQUIRED' | 'PRECONDITION_REQUIRED' | 'PRECONDITION_FAILED';
    };

@Injectable()
export class UpdateCurrentUserService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: UpdateCurrentUserCommand): Promise<UpdateCurrentUserResult> {
    if (command.sessionToken === undefined) {
      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    if (command.etag === undefined) {
      return {
        outcome: 'PRECONDITION_REQUIRED',
      };
    }

    const now = new Date();
    const profile = await this.accounts.findCurrentUserProfileBySession({
      now,
      refreshAfter: new Date(now.getTime() - sessionRefreshIntervalMilliseconds),
      refreshedIdleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MILLISECONDS),
      tokenHash: this.security.hashSecret(command.sessionToken, 'session-storage'),
    });

    if (profile === null) {
      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    const currentEtag = this.etagFor(profile);

    if (command.etag !== currentEtag) {
      return {
        outcome: 'PRECONDITION_FAILED',
      };
    }

    const updated = await this.accounts.updateCurrentUserProfile({
      expectedUserVersion: profile.version,
      inAppReminderNotificationsEnabled: command.inAppReminderNotificationsEnabled,
      timeZone: command.timeZone,
      userId: profile.userId,
    });

    if (updated === null) {
      return {
        outcome: 'PRECONDITION_FAILED',
      };
    }

    return {
      outcome: 'UPDATED',
      etag: this.etagFor(updated),
      profile: updated,
    };
  }

  private etagFor(profile: CurrentUserProfile): string {
    return `"${this.security.hashSecret(`${profile.userId}\0${profile.version}`, 'user-profile-etag')}"`;
  }
}
