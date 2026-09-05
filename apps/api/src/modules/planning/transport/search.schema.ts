import { z } from 'zod';

import type { ValidationProblemItem } from '../../../platform/http/api-problem.exception';

export const searchTasksQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Arama terimi boş olamaz.')
    .max(200, 'Arama terimi 200 karakterden uzun olamaz.')
    .transform((val) => val.trim()),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['relevance', 'plannedDate', 'dueDate', 'priority', 'title', 'createdAt', 'updatedAt'])
    .default('relevance'),
  order: z.enum(['asc', 'desc']).default('desc'),
  areaId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  canonicalStatus: z.enum(['TO_DO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  labelId: z.string().uuid().optional(),
});

export type SearchTasksQueryInput = z.infer<typeof searchTasksQuerySchema>;

export function parseSearchTasksQuery(input: unknown):
  | {
      success: true;
      data: SearchTasksQueryInput;
    }
  | {
      success: false;
      issues: ValidationProblemItem[];
    } {
  const result = searchTasksQuerySchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      code: zodIssueCode(issue),
      path: toJsonPointer(issue.path),
      message: issue.message,
    })),
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
  return `/${path.map((s) => String(s).replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;
}
