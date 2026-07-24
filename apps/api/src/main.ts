import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { parseApiEnvironment } from './platform/config/environment';
import { ProblemDetailsFilter } from './platform/http/problem-details.filter';

export async function bootstrapApi(): Promise<void> {
  const environment = parseApiEnvironment();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health/live', 'health/ready'],
  });
  app.use(helmet());
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
  app.enableShutdownHooks();

  await app.listen(environment.PORT, '0.0.0.0');
}

if (require.main === module) {
  void bootstrapApi();
}
