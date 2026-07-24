import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from './platform/database/database.module';
import { HealthModule } from './platform/health/health.module';
import { createLoggerParameters } from './platform/logging/logger';
import { VersionModule } from './platform/version/version.module';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerParameters('api')),
    DatabaseModule,
    HealthModule,
    VersionModule,
  ],
})
export class AppModule {}
