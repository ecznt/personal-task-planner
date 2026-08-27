import { Module } from '@nestjs/common';

import { PurgeJobHandler } from './application/purge-job.handler';
import { PurgeSchedulerService } from './application/purge.scheduler';
import { PurgeService } from './application/purge.service';
import { LifecycleRepository } from './infrastructure/lifecycle.repository';

@Module({
  exports: [PurgeJobHandler],
  providers: [
    LifecycleRepository,
    PurgeService,
    PurgeJobHandler,
    PurgeSchedulerService,
  ],
})
export class PlanningWorkerModule {}
