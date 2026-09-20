import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const checklistStepsSchema = z
  .array(z.string().trim().min(1, 'Kontrol listesi adımı boş olamaz.'))
  .max(100, 'En fazla 100 kontrol listesi adımı olabilir.');

const labelNamesSchema = z
  .array(z.string().trim().min(1, 'Etiket adı boş olamaz.'))
  .max(50, 'En fazla 50 etiket olabilir.');

const createTemplateSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, 'Şablon adı zorunludur.')
    .max(200, 'Şablon adı en fazla 200 karakter olabilir.'),
  description: z.string().max(5000, 'Açıklama en fazla 5000 karakter olabilir.').nullish(),
  priority: prioritySchema.default('MEDIUM'),
  checklistSteps: checklistStepsSchema.default([]),
  labelNames: labelNamesSchema.default([]),
  defaultPlannedAtOffsetDays: z.number().int().min(0).max(365).nullish(),
});

export type CreateTaskTemplateInput = z.infer<typeof createTemplateSchema> & {
  readonly description: string | null;
  readonly defaultPlannedAtOffsetDays: number | null;
};

export function parseCreateTaskTemplateInput(value: unknown): CreateTaskTemplateInput {
  const result = createTemplateSchema.safeParse(value);

  if (result.success) {
    return {
      ...result.data,
      description: result.data.description ?? null,
      defaultPlannedAtOffsetDays: result.data.defaultPlannedAtOffsetDays ?? null,
    };
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Şablon bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const updateTemplateSchema = z
  .strictObject({
    title: z.string().trim().min(1, 'Şablon adı zorunludur.').max(200, 'Şablon adı en fazla 200 karakter olabilir.').optional(),
    description: z.string().max(5000, 'Açıklama en fazla 5000 karakter olabilir.').nullish(),
    priority: prioritySchema.optional(),
    checklistSteps: checklistStepsSchema.optional(),
    labelNames: labelNamesSchema.optional(),
    defaultPlannedAtOffsetDays: z.number().int().min(0).max(365).nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'En az bir alan güncellenmelidir.',
  });

export type UpdateTaskTemplateInput = z.infer<typeof updateTemplateSchema> & {
  readonly description?: string | null;
  readonly defaultPlannedAtOffsetDays?: number | null;
};

export function parseUpdateTaskTemplateInput(value: unknown): UpdateTaskTemplateInput {
  const result = updateTemplateSchema.safeParse(value);

  if (result.success) {
    return {
      ...result.data,
      description: result.data.description ?? null,
      defaultPlannedAtOffsetDays: result.data.defaultPlannedAtOffsetDays ?? null,
    };
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Şablon bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const applyTemplateSchema = z.strictObject({
  areaId: z.string().uuid().optional(),
  projectId: z.string().uuid().nullish(),
  plannedAt: z.string().datetime().nullish(),
});

export type ApplyTaskTemplateInput = z.infer<typeof applyTemplateSchema> & {
  readonly projectId: string | null;
  readonly plannedAt: string | null;
};

export function parseApplyTaskTemplateInput(value: unknown): ApplyTaskTemplateInput {
  const result = applyTemplateSchema.safeParse(value);

  if (result.success) {
    return {
      ...result.data,
      projectId: result.data.projectId ?? null,
      plannedAt: result.data.plannedAt ?? null,
    };
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Uygulama bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listTemplatesQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListTaskTemplatesQueryInput = z.infer<typeof listTemplatesQuerySchema>;

export function parseListTaskTemplatesQuery(value: unknown): ListTaskTemplatesQueryInput {
  const result = listTemplatesQuerySchema.safeParse(value);

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