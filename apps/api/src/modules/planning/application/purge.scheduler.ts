import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { PrismaService } from '../../../platform/database/prisma.service';
import { JobQueueService } from '../../../platform/jobs/job-queue.service';
import { PLANNING_PURGE_JOB_TYPE } from './purge-job.port';

@Injectable()
export class PurgeSchedulerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private interval: NodeJS.Timeout | undefined;

  constructor(
    @Inject(JobQueueService) private readonly jobs: JobQueueService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PurgeSchedulerService.name);
  }

  onApplicationBootstrap(): void {
    this.interval = setInterval(() => {
      void this.enqueueIfIdle();
    }, 60_000);
    this.interval.unref();
  }

  onApplicationShutdown(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
    }
  }

  private async enqueueIfIdle(): Promise<void> {
    try {
      const active = await this.prisma.job.count({
        where: {
          type: PLANNING_PURGE_JOB_TYPE,
          state: { in: ['PENDING', 'PROCESSING'] },
        },
      });

      if (active > 0) {
        return;
      }

      await this.jobs.enqueue(PLANNING_PURGE_JOB_TYPE);
      this.logger.info('Planning purge job enqueued');
    } catch (error) {
      this.logger.warn({ error: safeError(error) }, 'Failed to enqueue planning purge job');
    }
  }
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'UNKNOWN';
}
