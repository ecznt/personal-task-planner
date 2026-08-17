import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import { PASSWORD_RESET_JOB_TYPE } from '../application/password-reset-email-delivery.port';
import { EMAIL_VERIFICATION_JOB_TYPE } from '../application/verification-email-delivery.port';

type AuthCounterInput = {
  readonly action:
    | 'REGISTRATION'
    | 'EMAIL_VERIFICATION_REQUEST'
    | 'EMAIL_VERIFICATION_CONFIRMATION'
    | 'LOGIN'
    | 'PASSWORD_RESET_REQUEST'
    | 'PASSWORD_RESET_CONFIRMATION'
    | 'REAUTHENTICATION';
  readonly identityKeyHash: string;
  readonly networkKeyHash: string;
  readonly now: Date;
  readonly windowMinutes: number;
};

export type LoginIdentity = {
  readonly enabled: boolean;
  readonly normalizedEmail: string;
  readonly passwordHash: string;
  readonly primaryEmail: string;
  readonly userId: string;
  readonly userIsActive: boolean;
  readonly verificationState: 'ACTIVE' | 'PENDING';
};

export type AuthenticatedSession = {
  readonly absoluteExpiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly primaryEmail: string;
  readonly userId: string;
};

export type CurrentUserProfile = {
  readonly accountLifecycleState: 'ACTIVE' | 'DELETION_CONFIRMED';
  readonly inAppReminderNotificationsEnabled: boolean;
  readonly onboardingCompletedAt: Date | null;
  readonly normalizedPrimaryEmail: string;
  readonly onboardingState: 'PENDING' | 'COMPLETED';
  readonly primaryEmail: string;
  readonly timeZone: string;
  readonly userId: string;
  readonly version: number;
};

export type ReauthenticationSession = {
  readonly passwordHash: string;
  readonly sessionId: string;
  readonly userId: string;
};

export type AccountDeletionProcessState = {
  readonly accessRevokedAt: Date;
  readonly processId: string;
  readonly requestedAt: Date;
  readonly state: 'PENDING_PRIMARY_PURGE';
};

type CreateLoginSessionInput = {
  readonly absoluteExpiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly now: Date;
  readonly previousTokenHash?: string;
  readonly tokenHash: string;
  readonly userId: string;
};

type PendingAccountInput = {
  readonly challengeExpiresAt: Date;
  readonly challengeId: string;
  readonly challengeTokenHash: string;
  readonly emailDisplayValue: string;
  readonly identityId: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string;
  readonly userId: string;
};

type AnonymousAuthTransactionInput = {
  readonly browserTokenHash: string;
  readonly csrfTokenHash: string;
  readonly expiresAt: Date;
};

type VerificationChallengeInput = {
  readonly challengeExpiresAt: Date;
  readonly challengeId: string;
  readonly challengeTokenHash: string;
  readonly normalizedEmail: string;
  readonly now: Date;
};

type PasswordResetChallengeInput = {
  readonly challengeExpiresAt: Date;
  readonly challengeId: string;
  readonly challengeTokenHash: string;
  readonly normalizedEmail: string;
  readonly now: Date;
};

export type VerificationDelivery = {
  readonly challengeId: string;
  readonly expiresAt: Date;
  readonly invalidatedAt: Date | null;
  readonly consumedAt: Date | null;
  readonly normalizedEmail: string;
  readonly recipient: string;
};

export type PasswordResetDelivery = {
  readonly challengeId: string;
  readonly expiresAt: Date;
  readonly invalidatedAt: Date | null;
  readonly consumedAt: Date | null;
  readonly recipient: string;
};

export type VerifyEmailInput = {
  readonly idempotencyId: string;
  readonly idempotencyKeyHash: string;
  readonly normalizedEmail: string;
  readonly now: Date;
  readonly requestFingerprint: string;
  readonly tokenHash: string;
};

export type VerifyEmailPersistenceResult =
  | {
      readonly outcome: 'VERIFIED' | 'REPLAYED';
      readonly response: {
        readonly data: {
          readonly next: '/login';
          readonly status: 'VERIFIED';
        };
      };
    }
  | {
      readonly outcome:
        | 'ALREADY_USED'
        | 'IDEMPOTENCY_IN_PROGRESS'
        | 'IDEMPOTENCY_KEY_REUSED'
        | 'INVALID_OR_EXPIRED';
    };

export type ResetPasswordInput = {
  readonly idempotencyId: string;
  readonly idempotencyKeyHash: string;
  readonly newPasswordHash: string;
  readonly now: Date;
  readonly requestFingerprint: string;
  readonly tokenHash: string;
};

export type ResetPasswordPersistenceResult =
  | {
      readonly outcome: 'RESET' | 'REPLAYED';
    }
  | {
      readonly outcome: 'IDEMPOTENCY_IN_PROGRESS' | 'IDEMPOTENCY_KEY_REUSED' | 'INVALID_OR_EXPIRED';
    };

export type InitiateAccountDeletionInput = {
  readonly expectedUserVersion: number;
  readonly idempotencyId: string;
  readonly idempotencyKeyHash: string;
  readonly now: Date;
  readonly requestFingerprint: string;
  readonly tokenHash: string;
};

export type InitiateAccountDeletionPersistenceResult =
  | {
      readonly outcome: 'ACCEPTED' | 'REPLAYED';
      readonly process: AccountDeletionProcessState;
    }
  | {
      readonly outcome:
        | 'AUTHENTICATION_REQUIRED'
        | 'IDEMPOTENCY_IN_PROGRESS'
        | 'IDEMPOTENCY_KEY_REUSED'
        | 'PRECONDITION_FAILED'
        | 'REAUTHENTICATION_REQUIRED';
    };

export type CompleteStartEmptyOnboardingInput = {
  readonly expectedUserVersion: number;
  readonly idempotencyId: string;
  readonly idempotencyKeyHash: string;
  readonly now: Date;
  readonly requestFingerprint: string;
  readonly tokenHash: string;
};

export type OnboardingCompletionState = {
  readonly choice: 'START_EMPTY';
  readonly completedAt: Date;
  readonly next: '/app/today';
  readonly profile: CurrentUserProfile;
  readonly status: 'COMPLETED';
};

export type CompleteStartEmptyOnboardingPersistenceResult =
  | {
      readonly completion: OnboardingCompletionState;
      readonly outcome: 'COMPLETED' | 'REPLAYED';
    }
  | {
      readonly outcome:
        | 'AUTHENTICATION_REQUIRED'
        | 'IDEMPOTENCY_IN_PROGRESS'
        | 'IDEMPOTENCY_KEY_REUSED'
        | 'PRECONDITION_FAILED';
    };

export type OnboardingCompletionIdempotencyReplayResult =
  | {
      readonly completion: OnboardingCompletionState;
      readonly outcome: 'REPLAYED';
    }
  | Extract<
      CompleteStartEmptyOnboardingPersistenceResult,
      {
        outcome:
          | 'AUTHENTICATION_REQUIRED'
          | 'IDEMPOTENCY_IN_PROGRESS'
          | 'IDEMPOTENCY_KEY_REUSED'
          | 'PRECONDITION_FAILED';
      }
    >;

export type AccountDeletionIdempotencyReplayResult =
  | {
      readonly outcome: 'REPLAYED';
      readonly process: AccountDeletionProcessState;
    }
  | Extract<
      InitiateAccountDeletionPersistenceResult,
      {
        outcome:
          | 'AUTHENTICATION_REQUIRED'
          | 'IDEMPOTENCY_IN_PROGRESS'
          | 'IDEMPOTENCY_KEY_REUSED'
          | 'PRECONDITION_FAILED'
          | 'REAUTHENTICATION_REQUIRED';
      }
    >;

@Injectable()
export class AccountsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createAnonymousAuthTransaction(input: AnonymousAuthTransactionInput): Promise<void> {
    await this.prisma.anonymousAuthTransaction.create({
      data: input,
    });
  }

  async hasValidAnonymousAuthTransaction(input: {
    readonly browserTokenHash: string;
    readonly csrfTokenHash: string;
    readonly now: Date;
  }): Promise<boolean> {
    const transaction = await this.prisma.anonymousAuthTransaction.findFirst({
      select: {
        id: true,
      },
      where: {
        browserTokenHash: input.browserTokenHash,
        csrfTokenHash: input.csrfTokenHash,
        expiresAt: {
          gt: input.now,
        },
      },
    });

    return transaction !== null;
  }

  async incrementAuthCounters(input: AuthCounterInput): Promise<{
    readonly identityCount: number;
    readonly networkCount: number;
  }> {
    const windowStartedAt = startOfWindow(input.now, input.windowMinutes);
    const expiresAt = new Date(windowStartedAt.getTime() + input.windowMinutes * 2 * 60 * 1_000);

    return this.prisma.$transaction(async (transaction) => {
      const identityCounter = await transaction.authAbuseCounter.upsert({
        create: {
          action: input.action,
          expiresAt,
          keyHash: input.identityKeyHash,
          windowStartedAt,
        },
        update: {
          requestCount: {
            increment: 1,
          },
        },
        where: {
          action_keyHash_windowStartedAt: {
            action: input.action,
            keyHash: input.identityKeyHash,
            windowStartedAt,
          },
        },
      });
      const networkCounter = await transaction.authAbuseCounter.upsert({
        create: {
          action: input.action,
          expiresAt,
          keyHash: input.networkKeyHash,
          windowStartedAt,
        },
        update: {
          requestCount: {
            increment: 1,
          },
        },
        where: {
          action_keyHash_windowStartedAt: {
            action: input.action,
            keyHash: input.networkKeyHash,
            windowStartedAt,
          },
        },
      });

      return {
        identityCount: identityCounter.requestCount,
        networkCount: networkCounter.requestCount,
      };
    });
  }

  async findLoginIdentity(normalizedEmail: string): Promise<LoginIdentity | null> {
    const identity = await this.prisma.authenticationIdentity.findUnique({
      select: {
        enabled: true,
        normalizedEmail: true,
        passwordHash: true,
        verificationState: true,
        user: {
          select: {
            accountLifecycleState: true,
            id: true,
            primaryEmail: true,
          },
        },
      },
      where: {
        normalizedEmail,
      },
    });

    if (identity === null) {
      return null;
    }

    return {
      enabled: identity.enabled,
      normalizedEmail: identity.normalizedEmail,
      passwordHash: identity.passwordHash,
      primaryEmail: identity.user.primaryEmail,
      userId: identity.user.id,
      userIsActive: identity.user.accountLifecycleState === 'ACTIVE',
      verificationState: identity.verificationState,
    };
  }

  async createLoginSession(input: CreateLoginSessionInput): Promise<AuthenticatedSession | null> {
    return this.prisma.$transaction(async (transaction) => {
      const users = await transaction.$queryRaw<
        {
          readonly id: string;
          readonly primaryEmail: string;
        }[]
      >`
        SELECT "id", "primaryEmail"
        FROM "users"
        WHERE "id" = ${input.userId}::uuid
          AND "accountLifecycleState" = 'ACTIVE'
        FOR UPDATE
      `;
      const user = users[0];

      if (user === undefined) {
        return null;
      }

      if (input.previousTokenHash !== undefined) {
        await transaction.session.updateMany({
          data: {
            revokedAt: input.now,
          },
          where: {
            revokedAt: null,
            tokenHash: input.previousTokenHash,
          },
        });
      }

      await transaction.session.create({
        data: {
          absoluteExpiresAt: input.absoluteExpiresAt,
          idleExpiresAt: input.idleExpiresAt,
          lastSeenAt: input.now,
          tokenHash: input.tokenHash,
          userId: input.userId,
        },
      });

      const activeSessions = await transaction.session.findMany({
        orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
        },
        where: {
          absoluteExpiresAt: {
            gt: input.now,
          },
          idleExpiresAt: {
            gt: input.now,
          },
          revokedAt: null,
          userId: input.userId,
        },
      });
      const overflowSessionIds = activeSessions.slice(5).map((session) => session.id);

      if (overflowSessionIds.length > 0) {
        await transaction.session.updateMany({
          data: {
            revokedAt: input.now,
          },
          where: {
            id: {
              in: overflowSessionIds,
            },
            revokedAt: null,
          },
        });
      }

      await transaction.authenticationIdentity.update({
        data: {
          lastAuthenticatedAt: input.now,
        },
        where: {
          userId: input.userId,
        },
      });

      return {
        absoluteExpiresAt: input.absoluteExpiresAt,
        idleExpiresAt: input.idleExpiresAt,
        primaryEmail: user.primaryEmail,
        userId: user.id,
      };
    });
  }

  async findAuthenticatedSession(input: {
    readonly now: Date;
    readonly refreshAfter: Date;
    readonly refreshedIdleExpiresAt: Date;
    readonly tokenHash: string;
  }): Promise<AuthenticatedSession | null> {
    const session = await this.prisma.session.findUnique({
      select: {
        absoluteExpiresAt: true,
        id: true,
        idleExpiresAt: true,
        lastSeenAt: true,
        revokedAt: true,
        user: {
          select: {
            accountLifecycleState: true,
            authenticationIdentity: {
              select: {
                enabled: true,
                verificationState: true,
              },
            },
            id: true,
            primaryEmail: true,
          },
        },
      },
      where: {
        tokenHash: input.tokenHash,
      },
    });

    if (
      session === null ||
      session.revokedAt !== null ||
      session.idleExpiresAt <= input.now ||
      session.absoluteExpiresAt <= input.now ||
      session.user.accountLifecycleState !== 'ACTIVE' ||
      session.user.authenticationIdentity?.enabled !== true ||
      session.user.authenticationIdentity.verificationState !== 'ACTIVE'
    ) {
      if (session !== null && session.revokedAt === null) {
        await this.prisma.session.updateMany({
          data: {
            revokedAt: input.now,
          },
          where: {
            id: session.id,
            revokedAt: null,
          },
        });
      }

      return null;
    }

    let idleExpiresAt = session.idleExpiresAt;

    if (session.lastSeenAt <= input.refreshAfter) {
      idleExpiresAt =
        input.refreshedIdleExpiresAt < session.absoluteExpiresAt
          ? input.refreshedIdleExpiresAt
          : session.absoluteExpiresAt;
      await this.prisma.session.updateMany({
        data: {
          idleExpiresAt,
          lastSeenAt: input.now,
        },
        where: {
          id: session.id,
          lastSeenAt: session.lastSeenAt,
          revokedAt: null,
        },
      });
    }

    return {
      absoluteExpiresAt: session.absoluteExpiresAt,
      idleExpiresAt,
      primaryEmail: session.user.primaryEmail,
      userId: session.user.id,
    };
  }

  async findCurrentUserProfileBySession(input: {
    readonly now: Date;
    readonly refreshAfter: Date;
    readonly refreshedIdleExpiresAt: Date;
    readonly tokenHash: string;
  }): Promise<CurrentUserProfile | null> {
    const session = await this.prisma.session.findUnique({
      select: {
        absoluteExpiresAt: true,
        id: true,
        idleExpiresAt: true,
        lastSeenAt: true,
        revokedAt: true,
        user: {
          select: {
            accountLifecycleState: true,
            authenticationIdentity: {
              select: {
                enabled: true,
                verificationState: true,
              },
            },
            id: true,
            inAppReminderNotificationsEnabled: true,
            normalizedPrimaryEmail: true,
            onboardingCompletedAt: true,
            onboardingState: true,
            primaryEmail: true,
            timeZone: true,
            version: true,
          },
        },
      },
      where: {
        tokenHash: input.tokenHash,
      },
    });

    if (
      session === null ||
      session.revokedAt !== null ||
      session.idleExpiresAt <= input.now ||
      session.absoluteExpiresAt <= input.now ||
      session.user.accountLifecycleState !== 'ACTIVE' ||
      session.user.authenticationIdentity?.enabled !== true ||
      session.user.authenticationIdentity.verificationState !== 'ACTIVE'
    ) {
      if (session !== null && session.revokedAt === null) {
        await this.prisma.session.updateMany({
          data: {
            revokedAt: input.now,
          },
          where: {
            id: session.id,
            revokedAt: null,
          },
        });
      }

      return null;
    }

    if (session.lastSeenAt <= input.refreshAfter) {
      await this.prisma.session.updateMany({
        data: {
          idleExpiresAt:
            input.refreshedIdleExpiresAt < session.absoluteExpiresAt
              ? input.refreshedIdleExpiresAt
              : session.absoluteExpiresAt,
          lastSeenAt: input.now,
        },
        where: {
          id: session.id,
          lastSeenAt: session.lastSeenAt,
          revokedAt: null,
        },
      });
    }

    return {
      accountLifecycleState: session.user.accountLifecycleState,
      inAppReminderNotificationsEnabled: session.user.inAppReminderNotificationsEnabled,
      normalizedPrimaryEmail: session.user.normalizedPrimaryEmail,
      onboardingCompletedAt: session.user.onboardingCompletedAt,
      onboardingState: session.user.onboardingState,
      primaryEmail: session.user.primaryEmail,
      timeZone: session.user.timeZone,
      userId: session.user.id,
      version: session.user.version,
    };
  }

  async updateCurrentUserProfile(input: {
    readonly expectedUserVersion: number;
    readonly timeZone: string;
    readonly userId: string;
  }): Promise<CurrentUserProfile | null> {
    const updated = await this.prisma.user.updateMany({
      data: {
        timeZone: input.timeZone,
        version: {
          increment: 1,
        },
      },
      where: {
        accountLifecycleState: 'ACTIVE',
        id: input.userId,
        version: input.expectedUserVersion,
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      select: {
        accountLifecycleState: true,
        inAppReminderNotificationsEnabled: true,
        normalizedPrimaryEmail: true,
        onboardingCompletedAt: true,
        onboardingState: true,
        primaryEmail: true,
        timeZone: true,
        version: true,
      },
      where: {
        id: input.userId,
      },
    });

    return {
      accountLifecycleState: user.accountLifecycleState,
      inAppReminderNotificationsEnabled: user.inAppReminderNotificationsEnabled,
      normalizedPrimaryEmail: user.normalizedPrimaryEmail,
      onboardingCompletedAt: user.onboardingCompletedAt,
      onboardingState: user.onboardingState,
      primaryEmail: user.primaryEmail,
      timeZone: user.timeZone,
      userId: input.userId,
      version: user.version,
    };
  }

  async findReauthenticationSessionByToken(input: {
    readonly now: Date;
    readonly tokenHash: string;
  }): Promise<ReauthenticationSession | null> {
    const session = await this.prisma.session.findUnique({
      select: {
        absoluteExpiresAt: true,
        id: true,
        idleExpiresAt: true,
        revokedAt: true,
        user: {
          select: {
            accountLifecycleState: true,
            authenticationIdentity: {
              select: {
                enabled: true,
                passwordHash: true,
                verificationState: true,
              },
            },
            id: true,
          },
        },
      },
      where: {
        tokenHash: input.tokenHash,
      },
    });

    if (
      session === null ||
      session.revokedAt !== null ||
      session.idleExpiresAt <= input.now ||
      session.absoluteExpiresAt <= input.now ||
      session.user.accountLifecycleState !== 'ACTIVE' ||
      session.user.authenticationIdentity?.enabled !== true ||
      session.user.authenticationIdentity.verificationState !== 'ACTIVE'
    ) {
      if (session !== null && session.revokedAt === null) {
        await this.prisma.session.updateMany({
          data: {
            revokedAt: input.now,
          },
          where: {
            id: session.id,
            revokedAt: null,
          },
        });
      }

      return null;
    }

    return {
      passwordHash: session.user.authenticationIdentity.passwordHash,
      sessionId: session.id,
      userId: session.user.id,
    };
  }

  async createReauthenticationProof(input: {
    readonly action: 'ACCOUNT_DELETION';
    readonly expiresAt: Date;
    readonly now: Date;
    readonly proofId: string;
    readonly sessionId: string;
    readonly userId: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.reauthenticationProof.updateMany({
        data: {
          consumedAt: input.now,
        },
        where: {
          action: input.action,
          consumedAt: null,
          sessionId: input.sessionId,
          userId: input.userId,
        },
      });
      await transaction.reauthenticationProof.create({
        data: {
          action: input.action,
          expiresAt: input.expiresAt,
          id: input.proofId,
          sessionId: input.sessionId,
          userId: input.userId,
        },
      });
    });
  }

  async revokeSession(input: { readonly now: Date; readonly tokenHash: string }): Promise<void> {
    await this.prisma.session.updateMany({
      data: {
        revokedAt: input.now,
      },
      where: {
        revokedAt: null,
        tokenHash: input.tokenHash,
      },
    });
  }

  async findAccountDeletionIdempotencyReplay(input: {
    readonly idempotencyKeyHash: string;
    readonly requestFingerprint: string;
  }): Promise<AccountDeletionIdempotencyReplayResult | null> {
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        keyHash: input.idempotencyKeyHash,
      },
    });

    if (existing === null) {
      return null;
    }

    if (existing.requestFingerprint !== input.requestFingerprint) {
      return {
        outcome: 'IDEMPOTENCY_KEY_REUSED',
      };
    }

    if (existing.state !== 'COMPLETED') {
      return {
        outcome: 'IDEMPOTENCY_IN_PROGRESS',
      };
    }

    if (isAccountDeletionResponse(existing.responseBody)) {
      return {
        outcome: 'REPLAYED',
        process: {
          accessRevokedAt: new Date(existing.responseBody.data.accessRevokedAt),
          processId: existing.responseBody.data.processId,
          requestedAt: new Date(existing.responseBody.data.requestedAt),
          state: existing.responseBody.data.state,
        },
      };
    }

    if (isAccountDeletionFailure(existing.responseBody)) {
      return existing.responseBody;
    }

    return {
      outcome: 'IDEMPOTENCY_IN_PROGRESS',
    };
  }

  async findOnboardingCompletionIdempotencyReplay(input: {
    readonly idempotencyKeyHash: string;
    readonly requestFingerprint: string;
  }): Promise<OnboardingCompletionIdempotencyReplayResult | null> {
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        keyHash: input.idempotencyKeyHash,
      },
    });

    if (existing === null) {
      return null;
    }

    if (existing.requestFingerprint !== input.requestFingerprint) {
      return {
        outcome: 'IDEMPOTENCY_KEY_REUSED',
      };
    }

    if (existing.state !== 'COMPLETED') {
      return {
        outcome: 'IDEMPOTENCY_IN_PROGRESS',
      };
    }

    if (isOnboardingCompletionResponse(existing.responseBody)) {
      return {
        completion: onboardingCompletionFromResponse(existing.responseBody),
        outcome: 'REPLAYED',
      };
    }

    if (isOnboardingCompletionFailure(existing.responseBody)) {
      return existing.responseBody;
    }

    return {
      outcome: 'IDEMPOTENCY_IN_PROGRESS',
    };
  }

  async completeStartEmptyOnboarding(
    input: CompleteStartEmptyOnboardingInput,
  ): Promise<CompleteStartEmptyOnboardingPersistenceResult> {
    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.idempotencyRecord.createMany({
        data: {
          expiresAt: new Date(input.now.getTime() + 48 * 60 * 60 * 1_000),
          id: input.idempotencyId,
          keyHash: input.idempotencyKeyHash,
          method: 'POST',
          requestFingerprint: input.requestFingerprint,
          route: '/api/v1/users/me/onboarding-completions',
        },
        skipDuplicates: true,
      });

      if (inserted.count === 0) {
        const existing = await transaction.idempotencyRecord.findUniqueOrThrow({
          where: {
            keyHash: input.idempotencyKeyHash,
          },
        });

        if (existing.requestFingerprint !== input.requestFingerprint) {
          return {
            outcome: 'IDEMPOTENCY_KEY_REUSED',
          };
        }

        if (
          existing.state === 'COMPLETED' &&
          isOnboardingCompletionResponse(existing.responseBody)
        ) {
          return {
            completion: onboardingCompletionFromResponse(existing.responseBody),
            outcome: 'REPLAYED',
          };
        }

        if (
          existing.state === 'COMPLETED' &&
          isOnboardingCompletionFailure(existing.responseBody)
        ) {
          return existing.responseBody;
        }

        return {
          outcome: 'IDEMPOTENCY_IN_PROGRESS',
        };
      }

      const session = await transaction.session.findUnique({
        select: {
          absoluteExpiresAt: true,
          idleExpiresAt: true,
          revokedAt: true,
          user: {
            select: {
              accountLifecycleState: true,
              authenticationIdentity: {
                select: {
                  enabled: true,
                  verificationState: true,
                },
              },
              id: true,
              version: true,
            },
          },
        },
        where: {
          tokenHash: input.tokenHash,
        },
      });

      if (
        session === null ||
        session.revokedAt !== null ||
        session.idleExpiresAt <= input.now ||
        session.absoluteExpiresAt <= input.now ||
        session.user.accountLifecycleState !== 'ACTIVE' ||
        session.user.authenticationIdentity?.enabled !== true ||
        session.user.authenticationIdentity.verificationState !== 'ACTIVE'
      ) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'AUTHENTICATION_REQUIRED',
            },
            responseStatus: 401,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'AUTHENTICATION_REQUIRED',
        };
      }

      if (session.user.version !== input.expectedUserVersion) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'PRECONDITION_FAILED',
            },
            responseStatus: 412,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'PRECONDITION_FAILED',
        };
      }

      await transaction.user.updateMany({
        data: {
          onboardingCompletedAt: input.now,
          onboardingState: 'COMPLETED',
          version: {
            increment: 1,
          },
        },
        where: {
          accountLifecycleState: 'ACTIVE',
          id: session.user.id,
          onboardingState: 'PENDING',
          version: input.expectedUserVersion,
        },
      });

      const user = await transaction.user.findUniqueOrThrow({
        select: {
          accountLifecycleState: true,
          inAppReminderNotificationsEnabled: true,
          normalizedPrimaryEmail: true,
          onboardingCompletedAt: true,
          onboardingState: true,
          primaryEmail: true,
          timeZone: true,
          version: true,
        },
        where: {
          id: session.user.id,
        },
      });
      const completedAt = user.onboardingCompletedAt ?? input.now;
      const response = onboardingCompletionResponse({
        choice: 'START_EMPTY',
        completedAt,
        next: '/app/today',
        profile: {
          accountLifecycleState: user.accountLifecycleState,
          inAppReminderNotificationsEnabled: user.inAppReminderNotificationsEnabled,
          normalizedPrimaryEmail: user.normalizedPrimaryEmail,
          onboardingCompletedAt: user.onboardingCompletedAt,
          onboardingState: user.onboardingState,
          primaryEmail: user.primaryEmail,
          timeZone: user.timeZone,
          userId: session.user.id,
          version: user.version,
        },
        status: 'COMPLETED',
      });

      await transaction.idempotencyRecord.update({
        data: {
          responseBody: response,
          responseStatus: 200,
          state: 'COMPLETED',
        },
        where: {
          id: input.idempotencyId,
        },
      });

      return {
        completion: onboardingCompletionFromResponse(response),
        outcome: 'COMPLETED',
      };
    });
  }

  async initiateAccountDeletion(
    input: InitiateAccountDeletionInput,
  ): Promise<InitiateAccountDeletionPersistenceResult> {
    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.idempotencyRecord.createMany({
        data: {
          expiresAt: new Date(input.now.getTime() + 48 * 60 * 60 * 1_000),
          id: input.idempotencyId,
          keyHash: input.idempotencyKeyHash,
          method: 'POST',
          requestFingerprint: input.requestFingerprint,
          route: '/api/v1/users/me/account-deletions',
        },
        skipDuplicates: true,
      });

      if (inserted.count === 0) {
        const existing = await transaction.idempotencyRecord.findUniqueOrThrow({
          where: {
            keyHash: input.idempotencyKeyHash,
          },
        });

        if (existing.requestFingerprint !== input.requestFingerprint) {
          return {
            outcome: 'IDEMPOTENCY_KEY_REUSED',
          };
        }

        if (existing.state === 'COMPLETED' && isAccountDeletionResponse(existing.responseBody)) {
          return {
            outcome: 'REPLAYED',
            process: {
              accessRevokedAt: new Date(existing.responseBody.data.accessRevokedAt),
              processId: existing.responseBody.data.processId,
              requestedAt: new Date(existing.responseBody.data.requestedAt),
              state: existing.responseBody.data.state,
            },
          };
        }

        if (existing.state === 'COMPLETED' && isAccountDeletionFailure(existing.responseBody)) {
          return existing.responseBody;
        }

        return {
          outcome: 'IDEMPOTENCY_IN_PROGRESS',
        };
      }

      const session = await transaction.session.findUnique({
        select: {
          absoluteExpiresAt: true,
          id: true,
          idleExpiresAt: true,
          revokedAt: true,
          user: {
            select: {
              accountLifecycleState: true,
              authenticationIdentity: {
                select: {
                  enabled: true,
                  verificationState: true,
                },
              },
              id: true,
              version: true,
            },
          },
        },
        where: {
          tokenHash: input.tokenHash,
        },
      });

      if (
        session === null ||
        session.revokedAt !== null ||
        session.idleExpiresAt <= input.now ||
        session.absoluteExpiresAt <= input.now ||
        session.user.accountLifecycleState !== 'ACTIVE' ||
        session.user.authenticationIdentity?.enabled !== true ||
        session.user.authenticationIdentity.verificationState !== 'ACTIVE'
      ) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'AUTHENTICATION_REQUIRED',
            },
            responseStatus: 401,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'AUTHENTICATION_REQUIRED',
        };
      }

      if (session.user.version !== input.expectedUserVersion) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'PRECONDITION_FAILED',
            },
            responseStatus: 412,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'PRECONDITION_FAILED',
        };
      }

      const proof = await transaction.reauthenticationProof.findFirst({
        select: {
          id: true,
        },
        where: {
          action: 'ACCOUNT_DELETION',
          consumedAt: null,
          expiresAt: {
            gt: input.now,
          },
          sessionId: session.id,
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (proof === null) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'REAUTHENTICATION_REQUIRED',
            },
            responseStatus: 401,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'REAUTHENTICATION_REQUIRED',
        };
      }

      const updated = await transaction.user.updateMany({
        data: {
          accessRevokedAt: input.now,
          accountLifecycleState: 'DELETION_CONFIRMED',
          deletionConfirmedAt: input.now,
          version: {
            increment: 1,
          },
        },
        where: {
          accountLifecycleState: 'ACTIVE',
          id: session.user.id,
          version: input.expectedUserVersion,
        },
      });

      if (updated.count !== 1) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'PRECONDITION_FAILED',
            },
            responseStatus: 412,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'PRECONDITION_FAILED',
        };
      }

      await transaction.reauthenticationProof.updateMany({
        data: {
          consumedAt: input.now,
        },
        where: {
          consumedAt: null,
          id: proof.id,
        },
      });
      await transaction.session.updateMany({
        data: {
          revokedAt: input.now,
        },
        where: {
          revokedAt: null,
          userId: session.user.id,
        },
      });
      await transaction.accountDeletionProcess.createMany({
        data: {
          accessRevokedAt: input.now,
          id: input.idempotencyId,
          requestedAt: input.now,
          state: 'PENDING_PRIMARY_PURGE',
          userId: session.user.id,
        },
        skipDuplicates: true,
      });
      const process = await transaction.accountDeletionProcess.findFirstOrThrow({
        select: {
          accessRevokedAt: true,
          id: true,
          requestedAt: true,
          state: true,
        },
        where: {
          state: 'PENDING_PRIMARY_PURGE',
          userId: session.user.id,
        },
      });
      const response = {
        data: {
          accessRevokedAt: process.accessRevokedAt.toISOString(),
          primaryPurgePending: true,
          processId: process.id,
          requestedAt: process.requestedAt.toISOString(),
          state: process.state,
        },
      } as const;

      await transaction.idempotencyRecord.update({
        data: {
          responseBody: response,
          responseStatus: 202,
          state: 'COMPLETED',
        },
        where: {
          id: input.idempotencyId,
        },
      });

      return {
        outcome: 'ACCEPTED',
        process: {
          accessRevokedAt: process.accessRevokedAt,
          processId: process.id,
          requestedAt: process.requestedAt,
          state: 'PENDING_PRIMARY_PURGE',
        },
      };
    });
  }

  async createPendingAccount(input: PendingAccountInput): Promise<'CREATED' | 'RETAINED'> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.user.create({
          data: {
            id: input.userId,
            normalizedPrimaryEmail: input.normalizedEmail,
            primaryEmail: input.emailDisplayValue,
            authenticationIdentity: {
              create: {
                id: input.identityId,
                normalizedEmail: input.normalizedEmail,
                passwordHash: input.passwordHash,
                verificationChallenges: {
                  create: {
                    expiresAt: input.challengeExpiresAt,
                    id: input.challengeId,
                    tokenHash: input.challengeTokenHash,
                  },
                },
              },
            },
          },
        });
        await transaction.job.create({
          data: {
            payload: {
              challengeId: input.challengeId,
            },
            type: EMAIL_VERIFICATION_JOB_TYPE,
          },
        });
      });

      return 'CREATED';
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return 'RETAINED';
      }

      throw error;
    }
  }

  async replacePendingVerificationChallenge(input: VerificationChallengeInput): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const identities = await transaction.$queryRaw<
        {
          readonly enabled: boolean;
          readonly id: string;
          readonly verificationState: string;
        }[]
      >`
        SELECT
          "id",
          "enabled",
          "verificationState"::text AS "verificationState"
        FROM "authentication_identities"
        WHERE "normalizedEmail" = ${input.normalizedEmail}
        FOR UPDATE
      `;
      const identity = identities[0];

      if (identity === undefined || !identity.enabled || identity.verificationState !== 'PENDING') {
        return false;
      }

      await transaction.emailVerificationChallenge.updateMany({
        data: {
          invalidatedAt: input.now,
        },
        where: {
          authenticationIdentityId: identity.id,
          consumedAt: null,
          invalidatedAt: null,
        },
      });
      await transaction.emailVerificationChallenge.create({
        data: {
          authenticationIdentityId: identity.id,
          expiresAt: input.challengeExpiresAt,
          id: input.challengeId,
          tokenHash: input.challengeTokenHash,
        },
      });
      await transaction.job.create({
        data: {
          payload: {
            challengeId: input.challengeId,
          },
          type: EMAIL_VERIFICATION_JOB_TYPE,
        },
      });

      return true;
    });
  }

  async findVerificationDelivery(challengeId: string): Promise<VerificationDelivery | null> {
    const challenge = await this.prisma.emailVerificationChallenge.findUnique({
      select: {
        consumedAt: true,
        expiresAt: true,
        id: true,
        invalidatedAt: true,
        authenticationIdentity: {
          select: {
            normalizedEmail: true,
            user: {
              select: {
                primaryEmail: true,
              },
            },
          },
        },
      },
      where: {
        id: challengeId,
      },
    });

    if (challenge === null) {
      return null;
    }

    return {
      challengeId: challenge.id,
      consumedAt: challenge.consumedAt,
      expiresAt: challenge.expiresAt,
      invalidatedAt: challenge.invalidatedAt,
      normalizedEmail: challenge.authenticationIdentity.normalizedEmail,
      recipient: challenge.authenticationIdentity.user.primaryEmail,
    };
  }

  async replacePasswordResetChallenge(input: PasswordResetChallengeInput): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const identities = await transaction.$queryRaw<
        {
          readonly accountLifecycleState: string;
          readonly enabled: boolean;
          readonly id: string;
          readonly verificationState: string;
        }[]
      >`
        SELECT
          identities."id",
          identities."enabled",
          identities."verificationState"::text AS "verificationState",
          users."accountLifecycleState"::text AS "accountLifecycleState"
        FROM "authentication_identities" identities
        INNER JOIN "users" users ON users."id" = identities."userId"
        WHERE identities."normalizedEmail" = ${input.normalizedEmail}
        FOR UPDATE OF identities
      `;
      const identity = identities[0];

      if (
        identity === undefined ||
        !identity.enabled ||
        identity.verificationState !== 'ACTIVE' ||
        identity.accountLifecycleState !== 'ACTIVE'
      ) {
        return false;
      }

      await transaction.passwordResetChallenge.updateMany({
        data: {
          invalidatedAt: input.now,
        },
        where: {
          authenticationIdentityId: identity.id,
          consumedAt: null,
          invalidatedAt: null,
        },
      });
      await transaction.passwordResetChallenge.create({
        data: {
          authenticationIdentityId: identity.id,
          expiresAt: input.challengeExpiresAt,
          id: input.challengeId,
          tokenHash: input.challengeTokenHash,
        },
      });
      await transaction.job.create({
        data: {
          payload: {
            challengeId: input.challengeId,
          },
          type: PASSWORD_RESET_JOB_TYPE,
        },
      });

      return true;
    });
  }

  async findPasswordResetDelivery(challengeId: string): Promise<PasswordResetDelivery | null> {
    const challenge = await this.prisma.passwordResetChallenge.findUnique({
      select: {
        consumedAt: true,
        expiresAt: true,
        id: true,
        invalidatedAt: true,
        authenticationIdentity: {
          select: {
            user: {
              select: {
                primaryEmail: true,
              },
            },
          },
        },
      },
      where: {
        id: challengeId,
      },
    });

    if (challenge === null) {
      return null;
    }

    return {
      challengeId: challenge.id,
      consumedAt: challenge.consumedAt,
      expiresAt: challenge.expiresAt,
      invalidatedAt: challenge.invalidatedAt,
      recipient: challenge.authenticationIdentity.user.primaryEmail,
    };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<VerifyEmailPersistenceResult> {
    const response = {
      data: {
        next: '/login',
        status: 'VERIFIED',
      },
    } as const;

    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.idempotencyRecord.createMany({
        data: {
          expiresAt: new Date(input.now.getTime() + 48 * 60 * 60 * 1_000),
          id: input.idempotencyId,
          keyHash: input.idempotencyKeyHash,
          method: 'POST',
          requestFingerprint: input.requestFingerprint,
          route: '/api/v1/auth/email-verifications',
        },
        skipDuplicates: true,
      });

      if (inserted.count === 0) {
        const existing = await transaction.idempotencyRecord.findUniqueOrThrow({
          where: {
            keyHash: input.idempotencyKeyHash,
          },
        });

        if (existing.requestFingerprint !== input.requestFingerprint) {
          return {
            outcome: 'IDEMPOTENCY_KEY_REUSED',
          };
        }

        if (existing.state === 'COMPLETED' && isVerificationResponse(existing.responseBody)) {
          return {
            outcome: 'REPLAYED',
            response: existing.responseBody,
          };
        }

        if (existing.state === 'COMPLETED' && isVerificationFailure(existing.responseBody)) {
          return existing.responseBody;
        }

        return {
          outcome: 'IDEMPOTENCY_IN_PROGRESS',
        };
      }

      const challenge = await transaction.emailVerificationChallenge.findFirst({
        select: {
          authenticationIdentityId: true,
          consumedAt: true,
          expiresAt: true,
          id: true,
          invalidatedAt: true,
          authenticationIdentity: {
            select: {
              verificationState: true,
            },
          },
        },
        where: {
          authenticationIdentity: {
            normalizedEmail: input.normalizedEmail,
          },
          tokenHash: input.tokenHash,
        },
      });

      if (
        challenge === null ||
        challenge.invalidatedAt !== null ||
        challenge.expiresAt <= input.now
      ) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'INVALID_OR_EXPIRED',
            },
            responseStatus: 422,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'INVALID_OR_EXPIRED',
        };
      }

      if (
        challenge.consumedAt !== null ||
        challenge.authenticationIdentity.verificationState === 'ACTIVE'
      ) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'ALREADY_USED',
            },
            responseStatus: 409,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'ALREADY_USED',
        };
      }

      const consumed = await transaction.emailVerificationChallenge.updateMany({
        data: {
          consumedAt: input.now,
        },
        where: {
          consumedAt: null,
          expiresAt: {
            gt: input.now,
          },
          id: challenge.id,
          invalidatedAt: null,
        },
      });
      const activated = await transaction.authenticationIdentity.updateMany({
        data: {
          verificationState: 'ACTIVE',
          verifiedAt: input.now,
          version: {
            increment: 1,
          },
        },
        where: {
          enabled: true,
          id: challenge.authenticationIdentityId,
          verificationState: 'PENDING',
        },
      });

      if (consumed.count !== 1 || activated.count !== 1) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'ALREADY_USED',
            },
            responseStatus: 409,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'ALREADY_USED',
        };
      }

      await transaction.idempotencyRecord.update({
        data: {
          responseBody: response,
          responseStatus: 200,
          state: 'COMPLETED',
        },
        where: {
          id: input.idempotencyId,
        },
      });

      return {
        outcome: 'VERIFIED',
        response,
      };
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordPersistenceResult> {
    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.idempotencyRecord.createMany({
        data: {
          expiresAt: new Date(input.now.getTime() + 48 * 60 * 60 * 1_000),
          id: input.idempotencyId,
          keyHash: input.idempotencyKeyHash,
          method: 'POST',
          requestFingerprint: input.requestFingerprint,
          route: '/api/v1/auth/password-resets',
        },
        skipDuplicates: true,
      });

      if (inserted.count === 0) {
        const existing = await transaction.idempotencyRecord.findUniqueOrThrow({
          where: {
            keyHash: input.idempotencyKeyHash,
          },
        });

        if (existing.requestFingerprint !== input.requestFingerprint) {
          return {
            outcome: 'IDEMPOTENCY_KEY_REUSED',
          };
        }

        if (existing.state === 'COMPLETED' && isResetPasswordResponse(existing.responseBody)) {
          return {
            outcome: 'REPLAYED',
          };
        }

        if (existing.state === 'COMPLETED' && isResetPasswordFailure(existing.responseBody)) {
          return existing.responseBody;
        }

        return {
          outcome: 'IDEMPOTENCY_IN_PROGRESS',
        };
      }

      const challenge = await transaction.passwordResetChallenge.findFirst({
        select: {
          authenticationIdentityId: true,
          consumedAt: true,
          expiresAt: true,
          id: true,
          invalidatedAt: true,
          authenticationIdentity: {
            select: {
              enabled: true,
              userId: true,
              verificationState: true,
              user: {
                select: {
                  accountLifecycleState: true,
                },
              },
            },
          },
        },
        where: {
          tokenHash: input.tokenHash,
        },
      });

      if (
        challenge === null ||
        challenge.consumedAt !== null ||
        challenge.invalidatedAt !== null ||
        challenge.expiresAt <= input.now ||
        !challenge.authenticationIdentity.enabled ||
        challenge.authenticationIdentity.verificationState !== 'ACTIVE' ||
        challenge.authenticationIdentity.user.accountLifecycleState !== 'ACTIVE'
      ) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'INVALID_OR_EXPIRED',
            },
            responseStatus: 422,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'INVALID_OR_EXPIRED',
        };
      }

      const consumed = await transaction.passwordResetChallenge.updateMany({
        data: {
          consumedAt: input.now,
        },
        where: {
          consumedAt: null,
          expiresAt: {
            gt: input.now,
          },
          id: challenge.id,
          invalidatedAt: null,
        },
      });
      const updated = await transaction.authenticationIdentity.updateMany({
        data: {
          passwordHash: input.newPasswordHash,
          version: {
            increment: 1,
          },
        },
        where: {
          enabled: true,
          id: challenge.authenticationIdentityId,
          verificationState: 'ACTIVE',
        },
      });

      if (consumed.count !== 1 || updated.count !== 1) {
        await transaction.idempotencyRecord.update({
          data: {
            responseBody: {
              outcome: 'INVALID_OR_EXPIRED',
            },
            responseStatus: 422,
            state: 'COMPLETED',
          },
          where: {
            id: input.idempotencyId,
          },
        });

        return {
          outcome: 'INVALID_OR_EXPIRED',
        };
      }

      await transaction.session.updateMany({
        data: {
          revokedAt: input.now,
        },
        where: {
          revokedAt: null,
          userId: challenge.authenticationIdentity.userId,
        },
      });
      await transaction.idempotencyRecord.update({
        data: {
          responseBody: {
            outcome: 'RESET',
          },
          responseStatus: 204,
          state: 'COMPLETED',
        },
        where: {
          id: input.idempotencyId,
        },
      });

      return {
        outcome: 'RESET',
      };
    });
  }
}

function startOfWindow(value: Date, windowMinutes: number): Date {
  const windowStart = new Date(value);
  const minute = Math.floor(windowStart.getUTCMinutes() / windowMinutes) * windowMinutes;
  windowStart.setUTCMinutes(minute, 0, 0);
  return windowStart;
}

function isVerificationResponse(value: unknown): value is {
  readonly data: {
    readonly next: '/login';
    readonly status: 'VERIFIED';
  };
} {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return false;
  }

  const data = value.data;

  return (
    typeof data === 'object' &&
    data !== null &&
    'next' in data &&
    data.next === '/login' &&
    'status' in data &&
    data.status === 'VERIFIED'
  );
}

function isVerificationFailure(value: unknown): value is {
  readonly outcome: 'ALREADY_USED' | 'INVALID_OR_EXPIRED';
} {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    return false;
  }

  return value.outcome === 'ALREADY_USED' || value.outcome === 'INVALID_OR_EXPIRED';
}

function isResetPasswordResponse(value: unknown): value is {
  readonly outcome: 'RESET';
} {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    return false;
  }

  return value.outcome === 'RESET';
}

function isResetPasswordFailure(value: unknown): value is {
  readonly outcome: 'INVALID_OR_EXPIRED';
} {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    return false;
  }

  return value.outcome === 'INVALID_OR_EXPIRED';
}

function isAccountDeletionResponse(value: unknown): value is {
  readonly data: {
    readonly accessRevokedAt: string;
    readonly primaryPurgePending: true;
    readonly processId: string;
    readonly requestedAt: string;
    readonly state: 'PENDING_PRIMARY_PURGE';
  };
} {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('data' in value) ||
    typeof value.data !== 'object' ||
    value.data === null
  ) {
    return false;
  }

  const data = value.data as Record<string, unknown>;

  return (
    typeof data.accessRevokedAt === 'string' &&
    data.primaryPurgePending === true &&
    typeof data.processId === 'string' &&
    typeof data.requestedAt === 'string' &&
    data.state === 'PENDING_PRIMARY_PURGE'
  );
}

function isAccountDeletionFailure(value: unknown): value is {
  readonly outcome: 'AUTHENTICATION_REQUIRED' | 'PRECONDITION_FAILED' | 'REAUTHENTICATION_REQUIRED';
} {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    return false;
  }

  return (
    value.outcome === 'AUTHENTICATION_REQUIRED' ||
    value.outcome === 'PRECONDITION_FAILED' ||
    value.outcome === 'REAUTHENTICATION_REQUIRED'
  );
}

function onboardingCompletionResponse(completion: OnboardingCompletionState): {
  readonly data: {
    readonly choice: 'START_EMPTY';
    readonly completedAt: string;
    readonly next: '/app/today';
    readonly status: 'COMPLETED';
    readonly user: {
      readonly accountLifecycleState: 'ACTIVE' | 'DELETION_CONFIRMED';
      readonly email: string;
      readonly id: string;
      readonly inAppReminderNotificationsEnabled: boolean;
      readonly normalizedPrimaryEmail: string;
      readonly onboardingCompletedAt: string | null;
      readonly onboardingState: 'PENDING' | 'COMPLETED';
      readonly timeZone: string;
      readonly version: number;
    };
  };
} {
  return {
    data: {
      choice: completion.choice,
      completedAt: completion.completedAt.toISOString(),
      next: completion.next,
      status: completion.status,
      user: {
        accountLifecycleState: completion.profile.accountLifecycleState,
        email: completion.profile.primaryEmail,
        id: completion.profile.userId,
        inAppReminderNotificationsEnabled: completion.profile.inAppReminderNotificationsEnabled,
        normalizedPrimaryEmail: completion.profile.normalizedPrimaryEmail,
        onboardingCompletedAt: completion.profile.onboardingCompletedAt?.toISOString() ?? null,
        onboardingState: completion.profile.onboardingState,
        timeZone: completion.profile.timeZone,
        version: completion.profile.version,
      },
    },
  };
}

function isOnboardingCompletionResponse(
  value: unknown,
): value is ReturnType<typeof onboardingCompletionResponse> {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('data' in value) ||
    typeof value.data !== 'object' ||
    value.data === null
  ) {
    return false;
  }

  const data = value.data as Record<string, unknown>;

  return (
    data.choice === 'START_EMPTY' &&
    typeof data.completedAt === 'string' &&
    data.next === '/app/today' &&
    data.status === 'COMPLETED' &&
    typeof data.user === 'object' &&
    data.user !== null
  );
}

function onboardingCompletionFromResponse(
  response: ReturnType<typeof onboardingCompletionResponse>,
): OnboardingCompletionState {
  return {
    choice: response.data.choice,
    completedAt: new Date(response.data.completedAt),
    next: response.data.next,
    profile: {
      accountLifecycleState: response.data.user.accountLifecycleState,
      inAppReminderNotificationsEnabled: response.data.user.inAppReminderNotificationsEnabled,
      normalizedPrimaryEmail: response.data.user.normalizedPrimaryEmail,
      onboardingCompletedAt:
        response.data.user.onboardingCompletedAt === null
          ? null
          : new Date(response.data.user.onboardingCompletedAt),
      onboardingState: response.data.user.onboardingState,
      primaryEmail: response.data.user.email,
      timeZone: response.data.user.timeZone,
      userId: response.data.user.id,
      version: response.data.user.version,
    },
    status: response.data.status,
  };
}

function isOnboardingCompletionFailure(value: unknown): value is {
  readonly outcome: 'AUTHENTICATION_REQUIRED' | 'PRECONDITION_FAILED';
} {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    return false;
  }

  return value.outcome === 'AUTHENTICATION_REQUIRED' || value.outcome === 'PRECONDITION_FAILED';
}

function isUniqueConstraintError(error: unknown): error is { readonly code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'P2002'
  );
}
