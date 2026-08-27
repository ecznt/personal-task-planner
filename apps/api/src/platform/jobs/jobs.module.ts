import { Global, Module } from '@nestjs/common';

import { JobQueueService } from './job-queue.service';

@Global()
@Module({
  exports: [JobQueueService],
  providers: [JobQueueService],
})
export class JobsModule {}
