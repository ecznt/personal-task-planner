import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

export const resourceTypeSchema = z.enum(['areas', 'projects', 'tasks']);

export type ResourceType = z.infer<typeof resourceTypeSchema>;

export function parseResourceType(value: unknown): ResourceType {
  const result = resourceTypeSchema.safeParse(value);
  if (result.success) return result.data;
  throw new ApiProblemException({
    status: 400,
    code: 'VALIDATION_FAILED',
    detail: 'Geçersiz kaynak türü.',
  });
}

const listLifecycleQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  resourceType: resourceTypeSchema.optional(),
});

export type ListLifecycleQuery = z.infer<typeof listLifecycleQuerySchema>;

export function parseListLifecycleQuery(value: unknown): ListLifecycleQuery {
  const result = listLifecycleQuerySchema.safeParse(value);
  if (!result.success) {
    throw new ApiProblemException({
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'Sorgu parametrelerini kontrol edin.',
      errors: result.error.issues.map(toValidationProblem),
    });
  }
  return result.data;
}

const confirmActionSchema = z.strictObject({
  confirmCascade: z.literal(true),
});

export type ConfirmActionInput = z.infer<typeof confirmActionSchema>;

export function parseConfirmAction(value: unknown): ConfirmActionInput {
  const result = confirmActionSchema.safeParse(value);
  if (!result.success) {
    throw new ApiProblemException({
      status: 422,
      code: 'VALIDATION_FAILED',
      detail: 'Basamaklı etki onayı gereklidir.',
      errors: result.error.issues.map(toValidationProblem),
    });
  }
  return result.data;
}

const restoreSchema = z.strictObject({
  replacementAreaId: z.string().uuid().optional(),
  replacementProjectId: z.string().uuid().optional(),
});

export type RestoreInput = z.infer<typeof restoreSchema>;

export function parseRestoreInput(value: unknown): RestoreInput {
  const result = restoreSchema.safeParse(value);
  if (!result.success) {
    throw new ApiProblemException({
      status: 422,
      code: 'VALIDATION_FAILED',
      detail: 'Geri yükleme hedefini kontrol edin.',
      errors: result.error.issues.map(toValidationProblem),
    });
  }
  return result.data;
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
  return path
    .map((segment) => String(segment).replace(/~/g, '~0').replace(/\//g, '~1'))
    .reduce((pointer, segment) => `${pointer}/${segment}`, '');
}
