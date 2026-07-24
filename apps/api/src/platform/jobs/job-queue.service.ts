import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export const FOUNDATION_JOB_TYPE = 'FOUNDATION_SYNTHETIC';

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
        WHERE "type" = ${FOUNDATION_JOB_TYPE}
          AND (
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
}
