import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const addChecklistItemSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, 'Madde metni zorunludur.')
    .max(1000, 'Madde metni en fazla 1000 karakter olabilir.'),
});

export type AddChecklistItemInput = z.infer<typeof addChecklistItemSchema>;

export function parseAddChecklistItemInput(value: unknown): AddChecklistItemInput {
  const result = addChecklistItemSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Madde bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const editChecklistItemSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, 'Madde metni zorunludur.')
    .max(1000, 'Madde metni en fazla 1000 karakter olabilir.'),
});

export type EditChecklistItemInput = z.infer<typeof editChecklistItemSchema>;

export function parseEditChecklistItemInput(value: unknown): EditChecklistItemInput {
  const result = editChecklistItemSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Madde bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const reorderChecklistSchema = z.strictObject({
  orderedIds: z.array(z.string().uuid()).min(1, 'Sıralama listesi boş olamaz.'),
});

export type ReorderChecklistInput = z.infer<typeof reorderChecklistSchema>;

export function parseReorderChecklistInput(value: unknown): ReorderChecklistInput {
  const result = reorderChecklistSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Sıralama bilgilerini kontrol edin.',
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
