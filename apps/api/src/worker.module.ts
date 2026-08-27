import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AccountsWorkerModule } from './modules/accounts/accounts-worker.module';
import { PlanningWorkerModule } from './modules/planning/planning-worker.module';
import { DatabaseModule } from './platform/database/database.module';
import { JobRunnerService } from './platform/jobs/job-runner.service';
import { JobsModule } from './platform/jobs/jobs.module';
import { createLoggerParameters } from './platform/logging/logger';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerParameters('worker')),
    DatabaseModule,
    JobsModule,
    AccountsWorkerModule,
    PlanningWorkerModule,
  ],
  providers: [JobRunnerService],
})
export class WorkerModule {}
