import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { parseWorkerEnvironment } from './platform/config/environment';
import { WorkerModule } from './worker.module';

export async function bootstrapWorker(): Promise<void> {
  parseWorkerEnvironment();

  const worker = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });

  worker.useLogger(worker.get(Logger));
  worker.enableShutdownHooks();
}

if (require.main === module) {
  void bootstrapWorker();
}
