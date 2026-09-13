import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const createTaskChecklistItemSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, 'Madde metni zorunludur.')
    .max(1000, 'Madde metni en fazla 1000 karakter olabilir.'),
});

const createTaskRecurrenceSchema = z.strictObject({
  mode: z.enum(['CALENDAR_BASED', 'COMPLETION_BASED']),
  frequency: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).default(1),
  selectedWeekdays: z.array(z.number().int().min(1).max(7)).default([]),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  monthOfYear: z.number().int().min(1).max(12).nullable().optional(),
  localTime: z.string().nullable().optional(),
});

const createTaskSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, 'Görev başlığı zorunludur.')
    .max(500, 'Görev başlığı en fazla 500 karakter olabilir.'),
  description: z
    .string()
    .max(5000, 'Görev açıklaması en fazla 5000 karakter olabilir.')
    .nullable()
    .optional(),
  plannedAt: z.coerce.date().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  projectId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  checklistItems: z
    .array(createTaskChecklistItemSchema)
    .max(100, 'En fazla 100 kontrol maddesi eklenebilir.')
    .optional(),
  recurrence: createTaskRecurrenceSchema.nullable().optional(),
});

export type CreateTaskChecklistItemInput = z.infer<typeof createTaskChecklistItemSchema>;
export type CreateTaskRecurrenceInput = z.infer<typeof createTaskRecurrenceSchema>;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export function parseCreateTaskInput(value: unknown): CreateTaskInput {
  const result = createTaskSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Görev bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const createTaskRequestSchema = createTaskSchema.extend({
  areaId: z.string().uuid().nullable().optional(),
});

export type CreateTaskRequestInput = z.infer<typeof createTaskRequestSchema>;

export function parseCreateTaskRequestInput(value: unknown): CreateTaskRequestInput {
  const result = createTaskRequestSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Görev bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const editTaskSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, 'Görev başlığı zorunludur.')
    .max(500, 'Görev başlığı en fazla 500 karakter olabilir.')
    .optional(),
  description: z
    .string()
    .max(5000, 'Görev açıklaması en fazla 5000 karakter olabilir.')
    .nullable()
    .optional(),
  plannedAt: z.coerce.date().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable().optional(),
  areaStatusId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export type EditTaskInput = z.infer<typeof editTaskSchema>;

export function parseEditTaskInput(value: unknown): EditTaskInput {
  const result = editTaskSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Görev bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const listTasksQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;

export function parseListTasksQuery(value: unknown): ListTasksQueryInput {
  const result = listTasksQuerySchema.safeParse(value);

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

const listGlobalTasksQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      'plannedDate',
      'dueDate',
      'priority',
      'title',
      'createdAt',
      'updatedAt',
      'canonicalStatus',
    ])
    .default('plannedDate'),
  order: z.enum(['asc', 'desc']).default('asc'),
  areaId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  canonicalStatus: z.enum(['TO_DO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  labelId: z.string().uuid().optional(),
});

export type ListGlobalTasksQueryInput = z.infer<typeof listGlobalTasksQuerySchema>;

export function parseListGlobalTasksQuery(value: unknown): ListGlobalTasksQueryInput {
  const result = listGlobalTasksQuerySchema.safeParse(value);

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

const listTodayTasksQuerySchema = z.object({
  timezone: z.string().min(1).default('Europe/Istanbul'),
});

export type ListTodayTasksQueryInput = z.infer<typeof listTodayTasksQuerySchema>;

export function parseListTodayTasksQuery(value: unknown): ListTodayTasksQueryInput {
  const result = listTodayTasksQuerySchema.safeParse(value);

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

const listUpcomingTasksQuerySchema = z.object({
  timezone: z.string().min(1).default('Europe/Istanbul'),
  days: z.coerce.number().int().min(1).max(31).default(14),
});

export type ListUpcomingTasksQueryInput = z.infer<typeof listUpcomingTasksQuerySchema>;

export function parseListUpcomingTasksQuery(value: unknown): ListUpcomingTasksQueryInput {
  const result = listUpcomingTasksQuerySchema.safeParse(value);

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

const moveKanbanTaskSchema = z.strictObject({
  taskId: z.string().uuid(),
  targetCanonicalStatus: z.enum(['TO_DO', 'IN_PROGRESS', 'COMPLETED']),
});

export type MoveKanbanTaskInput = z.infer<typeof moveKanbanTaskSchema>;

export function parseMoveKanbanTaskInput(value: unknown): MoveKanbanTaskInput {
  const result = moveKanbanTaskSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Kanban taşıma bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

const moveAreaKanbanTaskSchema = z.strictObject({
  taskId: z.string().uuid(),
  targetAreaStatusId: z.string().uuid(),
});

export type MoveAreaKanbanTaskInput = z.infer<typeof moveAreaKanbanTaskSchema>;

export function parseMoveAreaKanbanTaskInput(value: unknown): MoveAreaKanbanTaskInput {
  const result = moveAreaKanbanTaskSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Kanban taşıma bilgilerini kontrol edin.',
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
