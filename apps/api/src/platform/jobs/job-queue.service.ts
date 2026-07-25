import { randomInt, randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export const FOUNDATION_JOB_TYPE = 'FOUNDATION_SYNTHETIC';
export const MAX_JOB_ATTEMPTS = 5;

export type LeasedJob = {
  readonly id: bigint;
  readonly type: string;
  readonly payload: unknown;
  readonly attemptCount: number;
  readonly leaseToken: string;
  readonly leaseExpiresAt: Date;
};

@Injectable()
export class JobQueueService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async enqueueSynthetic(payload: Readonly<Record<string, string>>): Promise<bigint> {
    const job = await this.prisma.job.create({
      data: {
        type: FOUNDATION_JOB_TYPE,
        payload,
      },
      select: {
        id: true,
      },
    });

    return job.id;
  }

  async claimNext(options: {
    readonly workerId: string;
    readonly leaseMilliseconds: number;
  }): Promise<LeasedJob | null> {
    const leaseToken = randomUUID();
    const jobs = await this.prisma.$queryRaw<LeasedJob[]>`
      WITH candidate AS (
        SELECT "id"
        FROM "Job"
        WHERE (
            ("state" = 'PENDING'::"JobState" AND "availableAt" <= NOW())
            OR
            ("state" = 'PROCESSING'::"JobState" AND "leaseExpiresAt" <= NOW())
          )
        ORDER BY "availableAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "Job" AS job
      SET
        "state" = 'PROCESSING'::"JobState",
        "leaseOwner" = ${options.workerId},
        "leaseToken" = ${leaseToken}::uuid,
        "leaseExpiresAt" = NOW() + (${options.leaseMilliseconds} * INTERVAL '1 millisecond'),
        "attemptCount" = job."attemptCount" + 1,
        "updatedAt" = NOW()
      FROM candidate
      WHERE job."id" = candidate."id"
      RETURNING
        job."id",
        job."type",
        job."payload",
        job."attemptCount",
        job."leaseToken",
        job."leaseExpiresAt"
    `;

    return jobs[0] ?? null;
  }

  async complete(job: Pick<LeasedJob, 'id' | 'leaseToken'>): Promise<boolean> {
    const result = await this.prisma.job.updateMany({
      data: {
        leaseExpiresAt: null,
        leaseOwner: null,
        leaseToken: null,
        state: 'COMPLETED',
      },
      where: {
        id: job.id,
        leaseToken: job.leaseToken,
        state: 'PROCESSING',
      },
    });

    return result.count === 1;
  }

  async fail(
    job: Pick<LeasedJob, 'attemptCount' | 'id' | 'leaseToken'>,
    errorCategory: string,
  ): Promise<'FAILED' | 'RETRY_SCHEDULED' | 'STALE_LEASE'> {
    const terminal = job.attemptCount >= MAX_JOB_ATTEMPTS;
    const baseRetryDelaySeconds = Math.min(60 * 2 ** Math.max(0, job.attemptCount - 1), 8 * 60);
    const jitterRangeSeconds = Math.max(1, Math.floor(baseRetryDelaySeconds * 0.1));
    const retryDelaySeconds =
      baseRetryDelaySeconds + randomInt(-jitterRangeSeconds, jitterRangeSeconds + 1);
    const result = await this.prisma.job.updateMany({
      data: {
        ...(terminal ? {} : { availableAt: new Date(Date.now() + retryDelaySeconds * 1_000) }),
        lastErrorCategory: errorCategory,
        leaseExpiresAt: null,
        leaseOwner: null,
        leaseToken: null,
        state: terminal ? 'FAILED' : 'PENDING',
      },
      where: {
        id: job.id,
        leaseToken: job.leaseToken,
        state: 'PROCESSING',
      },
    });

    if (result.count !== 1) {
      return 'STALE_LEASE';
    }

    return terminal ? 'FAILED' : 'RETRY_SCHEDULED';
  }
}
