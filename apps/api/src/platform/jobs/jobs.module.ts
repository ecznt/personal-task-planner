import { Module } from '@nestjs/common';

import { JobQueueService } from './job-queue.service';
import { JobRunnerService } from './job-runner.service';

@Module({
  exports: [JobQueueService],
  providers: [JobQueueService, JobRunnerService],
})
export class JobsModule {}
