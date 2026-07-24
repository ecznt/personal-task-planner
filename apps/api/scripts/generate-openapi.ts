import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

function sortRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortRecursively);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortRecursively(child)]),
    );
  }

  return value;
}

async function generateOpenApi(): Promise<void> {
  process.env.DATABASE_URL ??= 'postgresql://planner:planner_dev@127.0.0.1:5432/planner';
  process.env.LOG_LEVEL ??= 'silent';
  process.env.NODE_ENV ??= 'test';

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health/live', 'health/ready'],
  });

  const configuration = new DocumentBuilder()
    .setTitle('Personal Task Planner API')
    .setDescription('Foundation contract. Product feature operations are intentionally absent.')
    .setVersion('0.0.0')
    .addServer('/')
    .build();
  const document = SwaggerModule.createDocument(app, configuration, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  document.openapi = '3.1.0';
  document.security = [];

  const outputDirectory = resolve(process.cwd(), 'openapi');
  const outputPath = resolve(outputDirectory, 'openapi.json');

  await mkdir(outputDirectory, {
    recursive: true,
  });
  await writeFile(
    outputPath,
    `${JSON.stringify(sortRecursively(document), undefined, 2)}\n`,
    'utf8',
  );
  await app.close();
}

void generateOpenApi();
