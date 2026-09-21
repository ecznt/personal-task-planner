import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const snoozeUnitSchema = z.enum(['MINUTES', 'HOURS', 'DAYS']);

const snoozeAmountSchema = z.number().int().min(1).max(365);

const taskSnoozeActionSchema = z.strictObject({
  target: z.enum(['PLANNED', 'DUE', 'BOTH']),
  amount: snoozeAmountSchema,
  unit: snoozeUnitSchema,
});

export type TaskSnoozeActionInput = z.infer<typeof taskSnoozeActionSchema>;

export function parseTaskSnoozeActionInput(value: unknown): TaskSnoozeActionInput {
  const result = taskSnoozeActionSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Erteleme bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const reminderSnoozeActionSchema = z.strictObject({
  amount: snoozeAmountSchema,
  unit: snoozeUnitSchema,
});

export type ReminderSnoozeActionInput = z.infer<typeof reminderSnoozeActionSchema>;

export function parseReminderSnoozeActionInput(value: unknown): ReminderSnoozeActionInput {
  const result = reminderSnoozeActionSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Erteleme bilgilerini kontrol edin.',
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