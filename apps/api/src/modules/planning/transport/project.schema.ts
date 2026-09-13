import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const createProjectSchema = z.strictObject({
  areaId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'Proje adı zorunludur.')
    .max(100, 'Proje adı en fazla 100 karakter olabilir.'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export function parseCreateProjectInput(value: unknown): CreateProjectInput {
  const result = createProjectSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Proje bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const updateProjectSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, 'Proje adı zorunludur.')
      .max(100, 'Proje adı en fazla 100 karakter olabilir.')
      .optional(),
    areaId: z.string().uuid().optional(),
  })
  .refine((value) => (value.name !== undefined) !== (value.areaId !== undefined), {
    message: 'Ya proje adı ya da taşınacağı alan belirtilmelidir.',
  });

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export function parseUpdateProjectInput(value: unknown): UpdateProjectInput {
  const result = updateProjectSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Proje bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listProjectsQuerySchema = z.object({
  areaId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListProjectsQueryInput = z.infer<typeof listProjectsQuerySchema>;

export function parseListProjectsQuery(value: unknown): ListProjectsQueryInput {
  const result = listProjectsQuerySchema.safeParse(value);

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
