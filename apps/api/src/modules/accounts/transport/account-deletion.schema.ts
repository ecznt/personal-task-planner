import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const accountDeletionSchema = z.strictObject({
  acknowledgedPermanentDeletion: z.literal(true, {
    error: 'Kalıcı silme sonucunu onaylamanız gerekir.',
  }),
  confirmation: z.literal('DELETE_MY_ACCOUNT', {
    error: 'Hesap silme onay metnini kontrol edin.',
  }),
});

const etagSchema = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .regex(/^"[A-Za-z0-9_-]+"$/);

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;

export function parseAccountDeletionInput(value: unknown): AccountDeletionInput {
  const result = accountDeletionSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Hesap silme onayını kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

export function parseIfMatch(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const result = etagSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'If-Match başlığını kontrol edin.',
    errors: result.error.issues.map((issue) => ({
      code: issue.code === 'invalid_format' ? 'INVALID_FORMAT' : 'INVALID_INPUT',
      path: '/headers/if-match',
      message: issue.message,
    })),
  });
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: 'INVALID_INPUT',
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
