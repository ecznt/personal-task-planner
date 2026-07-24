import {
  booleanFromEnvironment,
  formatEnvironmentErrors,
  integerFromEnvironment,
} from '@planner/config';
import { z } from 'zod';

const databaseUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
    message: 'Expected a PostgreSQL connection URL',
  });

const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

const sharedEnvironmentSchema = z.object({
  DATABASE_URL: databaseUrl,
  LOG_LEVEL: logLevel.default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const apiEnvironmentSchema = sharedEnvironmentSchema.extend({
  COOKIE_SECURE: booleanFromEnvironment.default(false),
  PORT: integerFromEnvironment({ minimum: 1, maximum: 65_535 }).default(3001),
  PUBLIC_ORIGIN: z.string().url(),
  TRUST_PROXY_HOPS: integerFromEnvironment({ minimum: 0, maximum: 10 }).default(0),
});

const workerEnvironmentSchema = sharedEnvironmentSchema.extend({
  WORKER_LEASE_MS: integerFromEnvironment({ minimum: 1_000, maximum: 15 * 60_000 }).default(30_000),
  WORKER_POLL_INTERVAL_MS: integerFromEnvironment({
    minimum: 100,
    maximum: 60_000,
  }).default(1_000),
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
export type WorkerEnvironment = z.infer<typeof workerEnvironmentSchema>;

function parseEnvironment<TSchema extends z.ZodType>(
  schema: TSchema,
  environment: NodeJS.ProcessEnv,
): z.infer<TSchema> {
  const result = schema.safeParse(environment);

  if (!result.success) {
    throw new Error(`Invalid environment: ${formatEnvironmentErrors(result.error)}`);
  }

  return result.data;
}

export function parseApiEnvironment(environment: NodeJS.ProcessEnv = process.env): ApiEnvironment {
  return parseEnvironment(apiEnvironmentSchema, environment);
}

export function parseWorkerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): WorkerEnvironment {
  return parseEnvironment(workerEnvironmentSchema, environment);
}
