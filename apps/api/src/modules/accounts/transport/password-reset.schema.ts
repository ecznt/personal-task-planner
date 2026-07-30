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

const passwordSchema = z
  .string()
  .min(12, 'Parola en az 12 karakter olmalıdır.')
  .max(128, 'Parola en fazla 128 karakter olabilir.');

const passwordResetRequestSchema = z.strictObject({
  email: emailSchema,
});

const resetPasswordSchema = z
  .strictObject({
    password: passwordSchema,
    passwordConfirmation: z.string(),
    token: z
      .string()
      .trim()
      .min(32, 'Parola sıfırlama bağlantısı geçersiz.')
      .max(512, 'Parola sıfırlama bağlantısı geçersiz.')
      .regex(/^[A-Za-z0-9_-]+$/, 'Parola sıfırlama bağlantısı geçersiz.'),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: 'Parola tekrarı eşleşmelidir.',
    path: ['passwordConfirmation'],
  });

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function parsePasswordResetRequest(value: unknown): PasswordResetRequestInput {
  return parseBody(passwordResetRequestSchema, value, 'Gönderilen e-posta adresini kontrol edin.');
}

export function parseResetPassword(value: unknown): ResetPasswordInput {
  return parseBody(
    resetPasswordSchema,
    value,
    'Gönderilen parola sıfırlama isteğini kontrol edin.',
  );
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
