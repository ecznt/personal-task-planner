import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { parseWorkerEnvironment } from '../config/environment';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobRunnerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private interval: NodeJS.Timeout | undefined;
  private readonly environment = parseWorkerEnvironment();
  private readonly workerId = `worker-${process.pid}`;

  constructor(
    @Inject(JobQueueService) private readonly jobs: JobQueueService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(JobRunnerService.name);
  }

  onApplicationBootstrap(): void {
    this.interval = setInterval(() => {
      void this.runOnce();
    }, this.environment.WORKER_POLL_INTERVAL_MS);
    this.interval.unref();
  }

  onApplicationShutdown(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
    }
  }

  private async runOnce(): Promise<void> {
    const job = await this.jobs.claimNext({
      leaseMilliseconds: this.environment.WORKER_LEASE_MS,
      workerId: this.workerId,
    });

    if (job === null) {
      return;
    }

    const completed = await this.jobs.complete(job);

    this.logger.info(
      {
        attempt: job.attemptCount,
        completed,
        jobId: job.id.toString(),
      },
      'Foundation job processed',
    );
  }
}
