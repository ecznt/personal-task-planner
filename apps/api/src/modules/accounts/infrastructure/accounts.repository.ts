import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../platform/database/prisma.service';

type RegistrationCounterInput = {
  readonly identityKeyHash: string;
  readonly networkKeyHash: string;
  readonly now: Date;
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

  async incrementRegistrationCounters(input: RegistrationCounterInput): Promise<{
    readonly identityCount: number;
    readonly networkCount: number;
  }> {
    const windowStartedAt = startOfUtcHour(input.now);
    const expiresAt = new Date(windowStartedAt.getTime() + 2 * 60 * 60 * 1_000);

    return this.prisma.$transaction(async (transaction) => {
      const identityCounter = await transaction.authAbuseCounter.upsert({
        create: {
          action: 'REGISTRATION',
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
            action: 'REGISTRATION',
            keyHash: input.identityKeyHash,
            windowStartedAt,
          },
        },
      });
      const networkCounter = await transaction.authAbuseCounter.upsert({
        create: {
          action: 'REGISTRATION',
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
            action: 'REGISTRATION',
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
      await this.prisma.user.create({
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

      return 'CREATED';
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return 'RETAINED';
      }

      throw error;
    }
  }
}

function startOfUtcHour(value: Date): Date {
  const windowStart = new Date(value);
  windowStart.setUTCMinutes(0, 0, 0);
  return windowStart;
}

function isUniqueConstraintError(error: unknown): error is { readonly code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'P2002'
  );
}
