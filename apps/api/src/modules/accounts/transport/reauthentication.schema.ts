import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const reauthenticationSchema = z.strictObject({
  action: z.literal('ACCOUNT_DELETION', {
    error: 'Bu işlem için geçerli yeniden doğrulama türünü seçin.',
  }),
  password: z
    .string()
    .min(1, 'Parola zorunludur.')
    .max(128, 'Parola en fazla 128 karakter olabilir.'),
});

export type ReauthenticationInput = z.infer<typeof reauthenticationSchema>;

export function parseReauthenticationInput(value: unknown): ReauthenticationInput {
  const result = reauthenticationSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Yeniden doğrulama bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: issue.code === 'too_big' ? 'TOO_LONG' : 'INVALID_INPUT',
    path: jsonPointer(issue.path),
    message: issue.message,
  };
}

function jsonPointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return '/';
  }

  return `/${path
    .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')}`;
}
