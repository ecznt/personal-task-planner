import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';

import { PrismaService } from '../../src/platform/database/prisma.service';
import { JobQueueService } from '../../src/platform/jobs/job-queue.service';

describe('PostgreSQL job leasing', () => {
  let container: StartedPostgreSqlContainer;
  let jobs: JobQueueService;
  let prisma: PrismaService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18.3-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.NODE_ENV = 'test';

    const migration = spawnSync('pnpm', ['--filter', '@planner/api', 'prisma:migrate:deploy'], {
      cwd: resolve(__dirname, '../../../..'),
      encoding: 'utf8',
      env: process.env,
    });

    if (migration.status !== 0) {
      throw new Error(`Migration failed: ${migration.stderr || migration.stdout}`);
    }

    prisma = new PrismaService();
    await prisma.$connect();
    jobs = new JobQueueService(prisma);
  });

  beforeEach(async () => {
    await prisma.job.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('allows only one concurrent claim to commit', async () => {
    const id = await jobs.enqueueSynthetic({
      proof: 'single-claim',
    });
    const eligibility = await prisma.$queryRaw<
      {
        readonly availableAt: Date;
        readonly databaseNow: Date;
        readonly eligible: boolean;
        readonly id: bigint;
        readonly state: string;
      }[]
    >`
      SELECT
        "id",
        "state"::text,
        "availableAt",
        "availableAt" <= NOW() AS "eligible",
        NOW() AS "databaseNow"
      FROM "Job"
      WHERE "id" = ${id}
    `;
    expect(eligibility).toEqual([
      expect.objectContaining({
        id,
        eligible: true,
        state: 'PENDING',
      }),
    ]);
    const [first, second] = await Promise.all([
      jobs.claimNext({
        leaseMilliseconds: 30_000,
        workerId: 'worker-a',
      }),
      jobs.claimNext({
        leaseMilliseconds: 30_000,
        workerId: 'worker-b',
      }),
    ]);
    const claimed = [first, second].filter((job) => job !== null);

    expect(claimed).toHaveLength(1);
    const leasedJob = claimed[0];
    if (leasedJob === undefined) {
      throw new Error('Expected exactly one leased job');
    }
    expect(leasedJob.id).toBe(id);
    await expect(jobs.complete(leasedJob)).resolves.toBe(true);
    await expect(jobs.complete(leasedJob)).resolves.toBe(false);
  });

  it('reclaims an expired lease without duplicating the job', async () => {
    const id = await jobs.enqueueSynthetic({
      proof: 'lease-recovery',
    });
    const original = await jobs.claimNext({
      leaseMilliseconds: 30_000,
      workerId: 'worker-a',
    });

    expect(original?.id).toBe(id);
    await prisma.job.update({
      data: {
        leaseExpiresAt: new Date(Date.now() - 1_000),
      },
      where: {
        id,
      },
    });

    const recovered = await jobs.claimNext({
      leaseMilliseconds: 30_000,
      workerId: 'worker-b',
    });

    expect(recovered).toMatchObject({
      attemptCount: 2,
      id,
    });
    if (recovered === null) {
      throw new Error('Expected the expired lease to be recovered');
    }
    await expect(jobs.complete(recovered)).resolves.toBe(true);
  });

  it('uses bounded retry and marks a job failed after five attempts', async () => {
    const id = await jobs.enqueueSynthetic({
      proof: 'bounded-retry',
    });

    for (let expectedAttempt = 1; expectedAttempt <= 5; expectedAttempt += 1) {
      const leased = await jobs.claimNext({
        leaseMilliseconds: 30_000,
        workerId: 'worker-a',
      });
      expect(leased).toMatchObject({
        attemptCount: expectedAttempt,
        id,
      });
      if (leased === null) {
        throw new Error('Expected a leased retry job');
      }

      await expect(jobs.fail(leased, 'EMAIL_DELIVERY_FAILED')).resolves.toBe(
        expectedAttempt === 5 ? 'FAILED' : 'RETRY_SCHEDULED',
      );

      if (expectedAttempt < 5) {
        await prisma.job.update({
          data: {
            availableAt: new Date(Date.now() - 1_000),
          },
          where: {
            id,
          },
        });
      }
    }

    await expect(prisma.job.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
      attemptCount: 5,
      lastErrorCategory: 'EMAIL_DELIVERY_FAILED',
      state: 'FAILED',
    });
  });
});
