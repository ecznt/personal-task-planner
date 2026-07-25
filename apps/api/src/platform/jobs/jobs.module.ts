import { Module } from '@nestjs/common';

import { JobQueueService } from './job-queue.service';

@Module({
  exports: [JobQueueService],
  providers: [JobQueueService],
})
export class JobsModule {}
