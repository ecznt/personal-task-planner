import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const setRecurrenceSchema = z.strictObject({
  mode: z.enum(['CALENDAR_BASED', 'COMPLETION_BASED']),
  frequency: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).default(1),
  selectedWeekdays: z.array(z.number().int().min(1).max(7)).default([]),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  monthOfYear: z.number().int().min(1).max(12).nullable().optional(),
  localTime: z.string().nullable().optional(),
});

export type SetRecurrenceInput = z.infer<typeof setRecurrenceSchema>;

export function parseSetRecurrenceInput(value: unknown): SetRecurrenceInput {
  const result = setRecurrenceSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Tekrarlama bilgilerini kontrol edin.',
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
  if (issue.code === 'invalid_format') return 'INVALID_FORMAT';
  if (issue.code === 'too_small') return 'TOO_SHORT';
  if (issue.code === 'too_big') return 'TOO_LONG';
  if (issue.code === 'invalid_value') return 'INVALID_VALUE';
  return 'INVALID_INPUT';
}

function toJsonPointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '/';
  return `/${path
    .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')}`;
}
