import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const createLabelSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Etiket adı zorunludur.')
    .max(100, 'Etiket adı en fazla 100 karakter olabilir.'),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;

export function parseCreateLabelInput(value: unknown): CreateLabelInput {
  const result = createLabelSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Etiket bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const renameLabelSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Etiket adı zorunludur.')
    .max(100, 'Etiket adı en fazla 100 karakter olabilir.'),
});

export type RenameLabelInput = z.infer<typeof renameLabelSchema>;

export function parseRenameLabelInput(value: unknown): RenameLabelInput {
  const result = renameLabelSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Etiket bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listLabelsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListLabelsQueryInput = z.infer<typeof listLabelsQuerySchema>;

export function parseListLabelsQuery(value: unknown): ListLabelsQueryInput {
  const result = listLabelsQuerySchema.safeParse(value);

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
