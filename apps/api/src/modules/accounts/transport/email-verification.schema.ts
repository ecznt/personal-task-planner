import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-posta adresi zorunludur.')
  .max(254, 'E-posta adresi en fazla 254 karakter olabilir.')
  .email('Geçerli bir e-posta adresi girin.');

const emailVerificationRequestSchema = z.strictObject({
  email: emailSchema,
});

const verifyEmailSchema = z.strictObject({
  code: z.string().regex(/^\d{8}$/, 'Doğrulama kodu 8 rakamdan oluşmalıdır.'),
  email: emailSchema,
});

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(16, 'Idempotency-Key en az 16 karakter olmalıdır.')
  .max(200, 'Idempotency-Key en fazla 200 karakter olabilir.')
  .regex(/^[\x21-\x7e]+$/, 'Idempotency-Key yalnızca görünür ASCII karakterleri içerebilir.');

export type EmailVerificationRequestInput = z.infer<typeof emailVerificationRequestSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export function parseEmailVerificationRequest(value: unknown): EmailVerificationRequestInput {
  return parseBody(
    emailVerificationRequestSchema,
    value,
    'Gönderilen e-posta adresini kontrol edin.',
  );
}

export function parseVerifyEmail(value: unknown): VerifyEmailInput {
  return parseBody(
    verifyEmailSchema,
    value,
    'Gönderilen e-posta ve doğrulama kodunu kontrol edin.',
  );
}

export function parseIdempotencyKey(value: unknown): string {
  const result = idempotencyKeySchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Idempotency-Key başlığını kontrol edin.',
    errors: result.error.issues.map((issue) => ({
      code: issueCode(issue),
      path: '/headers/idempotency-key',
      message: issue.message,
    })),
  });
}

function parseBody<T>(schema: z.ZodType<T>, value: unknown, detail: string): T {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail,
    errors: result.error.issues.map(toValidationProblem),
  });
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: issueCode(issue),
    path: jsonPointer(issue.path),
    message: issue.message,
  };
}

function issueCode(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_format') {
    return 'INVALID_FORMAT';
  }

  if (issue.code === 'too_small') {
    return 'TOO_SHORT';
  }

  if (issue.code === 'too_big') {
    return 'TOO_LONG';
  }

  return 'INVALID_INPUT';
}

function jsonPointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return '/';
  }

  return `/${path
    .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')}`;
}
