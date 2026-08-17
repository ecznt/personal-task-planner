import { Inject, Injectable } from '@nestjs/common';

import {
  AccountsRepository,
  type CompleteStartEmptyOnboardingPersistenceResult,
} from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';
import { SESSION_IDLE_MILLISECONDS } from './login.service';

export type CompleteOnboardingCommand = {
  readonly choice: 'START_EMPTY';
  readonly etag: string | undefined;
  readonly idempotencyKey: string;
  readonly sessionToken: string | undefined;
};

export type CompleteOnboardingResult =
  | CompleteStartEmptyOnboardingPersistenceResult
  | {
      readonly outcome: 'AUTHENTICATION_REQUIRED' | 'PRECONDITION_REQUIRED' | 'PRECONDITION_FAILED';
    };

@Injectable()
export class CompleteOnboardingService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: CompleteOnboardingCommand): Promise<CompleteOnboardingResult> {
    const idempotencyKeyHash = this.security.hashSecret(
      `POST\0/api/v1/users/me/onboarding-completions\0${command.idempotencyKey}`,
      'idempotency-key-storage',
    );
    const requestFingerprint = this.security.hashSecret(
      command.choice,
      'onboarding-completion-idempotency-fingerprint',
    );
    const replay = await this.accounts.findOnboardingCompletionIdempotencyReplay({
      idempotencyKeyHash,
      requestFingerprint,
    });

    if (replay !== null) {
      return replay;
    }

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
    const tokenHash = this.security.hashSecret(command.sessionToken, 'session-storage');
    const profile = await this.accounts.findCurrentUserProfileBySession({
      now,
      refreshAfter: new Date(now.getTime() - 60_000),
      refreshedIdleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MILLISECONDS),
      tokenHash,
    });

    if (profile === null) {
      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    if (command.etag !== this.etagFor(profile)) {
      return {
        outcome: 'PRECONDITION_FAILED',
      };
    }

    return this.accounts.completeStartEmptyOnboarding({
      expectedUserVersion: profile.version,
      idempotencyId: this.security.createIdentifier(),
      idempotencyKeyHash,
      now,
      requestFingerprint,
      tokenHash,
    });
  }

  etagFor(profile: { readonly userId: string; readonly version: number }): string {
    return `"${this.security.hashSecret(`${profile.userId}\0${profile.version}`, 'user-profile-etag')}"`;
  }
}
