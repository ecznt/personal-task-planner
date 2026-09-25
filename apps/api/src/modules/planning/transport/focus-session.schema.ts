import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';
import {
  MAX_FOCUS_SESSION_MINUTES,
  MIN_FOCUS_SESSION_MINUTES,
} from '../infrastructure/focus-session.repository';

const createFocusSessionSchema = z.strictObject({
  startedAt: z.string().datetime('Başlangıç zamanı geçerli olmalıdır.'),
  completedAt: z.string().datetime('Bitiş zamanı geçerli olmalıdır.'),
  durationMinutes: z
    .number()
    .int('Süre tam sayı olmalıdır.')
    .min(MIN_FOCUS_SESSION_MINUTES, `En az ${MIN_FOCUS_SESSION_MINUTES} dakika olmalıdır.`)
    .max(MAX_FOCUS_SESSION_MINUTES, `En fazla ${MAX_FOCUS_SESSION_MINUTES} dakika olmalıdır.`),
  clientKey: z
    .string()
    .trim()
    .min(1, 'Odak seans anahtarı zorunludur.')
    .max(100, 'Odak seans anahtarı en fazla 100 karakter olabilir.'),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;

export function parseCreateFocusSessionInput(value: unknown): CreateFocusSessionInput {
  const result = createFocusSessionSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Odak seans bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listFocusSessionsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListFocusSessionsQueryInput = z.infer<typeof listFocusSessionsQuerySchema>;

export function parseListFocusSessionsQuery(value: unknown): ListFocusSessionsQueryInput {
  const result = listFocusSessionsQuerySchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Sorgu parametrelerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const focusStatisticsQuerySchema = z.object({
  timezone: z.string().trim().min(1).default('Europe/Istanbul'),
});

export type FocusStatisticsQueryInput = z.infer<typeof focusStatisticsQuerySchema>;

export function parseFocusStatisticsQuery(value: unknown): FocusStatisticsQueryInput {
  const result = focusStatisticsQuerySchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Sorgu parametrelerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: zodIssueCode(issue),
    path: toJsonPointer(issue.path),
    message: issue.message,
  };
}

function zodIssueCode(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_format') {
    return 'INVALID_FORMAT';
  }

  if (issue.code === 'too_small') {
    return 'TOO_SHORT';
  }

  if (issue.code === 'too_big') {
    return 'TOO_LONG';
  }

  if (issue.code === 'invalid_value') {
    return 'INVALID_VALUE';
  }

  return 'INVALID_INPUT';
}

function toJsonPointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return '/';
  }

  return `/${path
    .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')}`;
}