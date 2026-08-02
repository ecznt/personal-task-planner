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
  process.env.AUTH_SECURITY_KEY ??= 'openapi-only-auth-security-key-value';
  process.env.DATABASE_URL ??= 'postgresql://planner:planner_dev@127.0.0.1:5432/planner';
  process.env.LOG_LEVEL ??= 'silent';
  process.env.NODE_ENV ??= 'test';
  process.env.PUBLIC_ORIGIN ??= 'http://127.0.0.1:3000';

  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: false,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health/live', 'health/ready'],
  });

  const configuration = new DocumentBuilder()
    .setTitle('Personal Task Planner API')
    .setDescription('REST contract for the personal task planner.')
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

generateOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
