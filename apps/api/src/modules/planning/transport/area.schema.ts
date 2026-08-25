import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const createAreaSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Alan adı zorunludur.')
    .max(100, 'Alan adı en fazla 100 karakter olabilir.'),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;

export function parseCreateAreaInput(value: unknown): CreateAreaInput {
  const result = createAreaSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Alan bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const renameAreaSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Alan adı zorunludur.')
    .max(100, 'Alan adı en fazla 100 karakter olabilir.'),
});

export type RenameAreaInput = z.infer<typeof renameAreaSchema>;

export function parseRenameAreaInput(value: unknown): RenameAreaInput {
  const result = renameAreaSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Alan bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listAreasQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAreasQueryInput = z.infer<typeof listAreasQuerySchema>;

export function parseListAreasQuery(value: unknown): ListAreasQueryInput {
  const result = listAreasQuerySchema.safeParse(value);

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

const createAreaStatusSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Durum adı zorunludur.')
    .max(100, 'Durum adı en fazla 100 karakter olabilir.'),
  canonicalStatus: z.enum(['TO_DO', 'IN_PROGRESS', 'COMPLETED']),
});

export type CreateAreaStatusInput = z.infer<typeof createAreaStatusSchema>;

export function parseCreateAreaStatusInput(value: unknown): CreateAreaStatusInput {
  const result = createAreaStatusSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Durum bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const updateAreaStatusNameSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Durum adı zorunludur.')
    .max(100, 'Durum adı en fazla 100 karakter olabilir.'),
});

export type UpdateAreaStatusNameInput = z.infer<typeof updateAreaStatusNameSchema>;

export function parseUpdateAreaStatusNameInput(value: unknown): UpdateAreaStatusNameInput {
  const result = updateAreaStatusNameSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Durum bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const reorderAreaStatusesSchema = z.strictObject({
  statusIds: z.array(z.string().uuid()).min(1, 'En az bir durum seçmelisiniz.'),
});

export type ReorderAreaStatusesInput = z.infer<typeof reorderAreaStatusesSchema>;

export function parseReorderAreaStatusesInput(value: unknown): ReorderAreaStatusesInput {
  const result = reorderAreaStatusesSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Durum sıralama bilgilerini kontrol edin.',
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
