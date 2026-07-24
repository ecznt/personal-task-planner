import { randomUUID } from 'node:crypto';

import type { Params } from 'nestjs-pino';
import type { LoggerOptions } from 'pino';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body',
  'res.headers["set-cookie"]',
  'password',
  'token',
  'secret',
  'databaseUrl',
] as const;

export function createPinoOptions(processName: 'api' | 'worker'): LoggerOptions {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    base: {
      process: processName,
    },
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [...redactPaths],
      censor: '[REDACTED]',
    },
    ...(isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          },
        }
      : {}),
  };
}

export function createLoggerParameters(processName: 'api' | 'worker'): Params {
  return {
    pinoHttp: {
      ...createPinoOptions(processName),
      genReqId(request, response) {
        const suppliedId = request.headers['x-request-id'];
        const requestId =
          typeof suppliedId === 'string' && suppliedId.length <= 128 ? suppliedId : randomUUID();

        response.setHeader('x-request-id', requestId);
        return requestId;
      },
    },
  };
}

export const LOG_REDACTION_PATHS = redactPaths;
