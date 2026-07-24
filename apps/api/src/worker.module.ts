import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from './platform/database/database.module';
import { JobsModule } from './platform/jobs/jobs.module';
import { createLoggerParameters } from './platform/logging/logger';

@Module({
  imports: [LoggerModule.forRoot(createLoggerParameters('worker')), DatabaseModule, JobsModule],
})
export class WorkerModule {}
