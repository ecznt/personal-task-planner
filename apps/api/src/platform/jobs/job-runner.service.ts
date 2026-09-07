import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { EmailVerificationJobHandler } from '../../modules/accounts/application/email-verification-job.handler';
import { PasswordResetJobHandler } from '../../modules/accounts/application/password-reset-job.handler';
import { PASSWORD_RESET_JOB_TYPE } from '../../modules/accounts/application/password-reset-email-delivery.port';
import { EMAIL_VERIFICATION_JOB_TYPE } from '../../modules/accounts/application/verification-email-delivery.port';
import { PLANNING_PURGE_JOB_TYPE } from '../../modules/planning/application/purge-job.port';
import { PurgeJobHandler } from '../../modules/planning/application/purge-job.handler';
import { parseWorkerEnvironment } from '../config/environment';
import { FOUNDATION_JOB_TYPE, type LeasedJob, JobQueueService } from './job-queue.service';

@Injectable()
export class JobRunnerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private interval: NodeJS.Timeout | undefined;
  private readonly environment = parseWorkerEnvironment();
  private readonly workerId = `worker-${process.pid}`;

  constructor(
    @Inject(JobQueueService) private readonly jobs: JobQueueService,
    @Inject(EmailVerificationJobHandler)
    private readonly emailVerification: EmailVerificationJobHandler,
    @Inject(PasswordResetJobHandler)
    private readonly passwordReset: PasswordResetJobHandler,
    @Inject(PurgeJobHandler)
    private readonly planningPurge: PurgeJobHandler,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(JobRunnerService.name);
  }

  onApplicationBootstrap(): void {
    this.interval = setInterval(() => {
      void this.runOnce();
    }, this.environment.WORKER_POLL_INTERVAL_MS);
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

    try {
      await this.handle(job);
      const completed = await this.jobs.complete(job);

      this.logger.info(
        {
          attempt: job.attemptCount,
          completed,
          jobId: job.id.toString(),
          jobType: job.type,
        },
        'Job processed',
      );
    } catch (error) {
      const errorCategory = safeErrorCategory(error);
      const outcome = await this.jobs.fail(job, errorCategory);

      this.logger.warn(
        {
          attempt: job.attemptCount,
          errorCategory,
          jobId: job.id.toString(),
          jobType: job.type,
          outcome,
        },
        'Job processing failed',
      );
    }
  }

  private async handle(job: LeasedJob): Promise<void> {
    if (job.type === FOUNDATION_JOB_TYPE) {
      return;
    }

    if (job.type === EMAIL_VERIFICATION_JOB_TYPE) {
      const challengeId = parseChallengeId(job.payload);
      await this.emailVerification.handle(challengeId);
      return;
    }

    if (job.type === PASSWORD_RESET_JOB_TYPE) {
      const challengeId = parseChallengeId(job.payload);
      await this.passwordReset.handle(challengeId);
      return;
    }

    if (job.type === PLANNING_PURGE_JOB_TYPE) {
      await this.planningPurge.handle();
      return;
    }

    throw new Error('UNSUPPORTED_JOB_TYPE');
  }
}

function parseChallengeId(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'challengeId' in payload &&
    typeof payload.challengeId === 'string'
  ) {
    return payload.challengeId;
  }

  throw new Error('INVALID_JOB_PAYLOAD');
}

function safeErrorCategory(error: unknown): string {
  if (error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)) {
    return error.message;
  }

  return 'EMAIL_DELIVERY_FAILED';
}
