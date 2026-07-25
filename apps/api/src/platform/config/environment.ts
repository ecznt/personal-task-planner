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

const securityEnvironmentSchema = z.object({
  AUTH_SECURITY_KEY: z.string().min(32),
});

const emailEnvironmentShape = {
  PUBLIC_ORIGIN: z.string().url(),
  SMTP_FROM: z.string().email(),
  SMTP_HOST: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_PORT: integerFromEnvironment({ minimum: 1, maximum: 65_535 }).default(1025),
  SMTP_SECURE: booleanFromEnvironment.default(false),
  SMTP_USERNAME: z.string().min(1).optional(),
} as const;

const emailEnvironmentSchema = z.object(emailEnvironmentShape).superRefine(validateSmtpCredentials);

const apiEnvironmentSchema = sharedEnvironmentSchema.extend({
  ...securityEnvironmentSchema.shape,
  COOKIE_SECURE: booleanFromEnvironment.default(false),
  PORT: integerFromEnvironment({ minimum: 1, maximum: 65_535 }).default(3001),
  PUBLIC_ORIGIN: z.string().url(),
  TRUST_PROXY_HOPS: integerFromEnvironment({ minimum: 0, maximum: 10 }).default(0),
});

const workerEnvironmentSchema = sharedEnvironmentSchema
  .extend({
    ...securityEnvironmentSchema.shape,
    ...emailEnvironmentShape,
    WORKER_LEASE_MS: integerFromEnvironment({ minimum: 1_000, maximum: 15 * 60_000 }).default(
      30_000,
    ),
    WORKER_POLL_INTERVAL_MS: integerFromEnvironment({
      minimum: 100,
      maximum: 60_000,
    }).default(1_000),
  })
  .superRefine(validateSmtpCredentials);

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
export type EmailEnvironment = z.infer<typeof emailEnvironmentSchema>;
export type SecurityEnvironment = z.infer<typeof securityEnvironmentSchema>;
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

export function parseEmailEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): EmailEnvironment {
  return parseEnvironment(emailEnvironmentSchema, environment);
}

export function parseSecurityEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): SecurityEnvironment {
  return parseEnvironment(securityEnvironmentSchema, environment);
}

export function parseWorkerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): WorkerEnvironment {
  return parseEnvironment(workerEnvironmentSchema, environment);
}

function validateSmtpCredentials(
  value: {
    readonly SMTP_PASSWORD?: string | undefined;
    readonly SMTP_USERNAME?: string | undefined;
  },
  context: z.RefinementCtx,
): void {
  if ((value.SMTP_USERNAME === undefined) !== (value.SMTP_PASSWORD === undefined)) {
    context.addIssue({
      code: 'custom',
      message: 'SMTP_USERNAME and SMTP_PASSWORD must be configured together',
      path: ['SMTP_USERNAME'],
    });
  }
}
