import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';
import { EMAIL_VERIFICATION_JOB_TYPE } from '../application/verification-email-delivery.port';

type AuthCounterInput = {
  readonly action:
    'REGISTRATION' | 'EMAIL_VERIFICATION_REQUEST' | 'EMAIL_VERIFICATION_CONFIRMATION';
  readonly identityKeyHash: string;
  readonly networkKeyHash: string;
  readonly now: Date;
  readonly windowMinutes: number;
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

export type VerificationDelivery = {
  readonly challengeId: string;
  readonly expiresAt: Date;
  readonly invalidatedAt: Date | null;
  readonly consumedAt: Date | null;
  readonly normalizedEmail: string;
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

function isUniqueConstraintError(error: unknown): error is { readonly code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'P2002'
  );
}
