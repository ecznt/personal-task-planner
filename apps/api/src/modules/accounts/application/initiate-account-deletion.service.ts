import { Inject, Injectable } from '@nestjs/common';

import {
  AccountsRepository,
  type InitiateAccountDeletionPersistenceResult,
} from '../infrastructure/accounts.repository';
import { AuthSecurityService } from '../security/auth-security.service';

export type InitiateAccountDeletionCommand = {
  readonly confirmation: 'DELETE_MY_ACCOUNT';
  readonly etag: string | undefined;
  readonly idempotencyKey: string;
  readonly sessionToken: string | undefined;
};

export type InitiateAccountDeletionResult =
  | InitiateAccountDeletionPersistenceResult
  | {
      readonly outcome: 'AUTHENTICATION_REQUIRED' | 'PRECONDITION_REQUIRED' | 'PRECONDITION_FAILED';
    };

@Injectable()
export class InitiateAccountDeletionService {
  constructor(
    @Inject(AccountsRepository)
    private readonly accounts: AccountsRepository,
    @Inject(AuthSecurityService)
    private readonly security: AuthSecurityService,
  ) {}

  async execute(command: InitiateAccountDeletionCommand): Promise<InitiateAccountDeletionResult> {
    const idempotencyKeyHash = this.security.hashSecret(
      `POST\0/api/v1/users/me/account-deletions\0${command.idempotencyKey}`,
      'idempotency-key-storage',
    );
    const requestFingerprint = this.security.hashSecret(
      command.confirmation,
      'account-deletion-idempotency-fingerprint',
    );
    const replay = await this.accounts.findAccountDeletionIdempotencyReplay({
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
      refreshAfter: new Date(0),
      refreshedIdleExpiresAt: now,
      tokenHash,
    });

    if (profile === null) {
      return {
        outcome: 'AUTHENTICATION_REQUIRED',
      };
    }

    const currentEtag = `"${this.security.hashSecret(
      `${profile.userId}\0${profile.version}`,
      'user-profile-etag',
    )}"`;

    if (command.etag !== currentEtag) {
      return {
        outcome: 'PRECONDITION_FAILED',
      };
    }

    return this.accounts.initiateAccountDeletion({
      expectedUserVersion: profile.version,
      idempotencyId: this.security.createIdentifier(),
      idempotencyKeyHash,
      now,
      requestFingerprint,
      tokenHash,
    });
  }
}
