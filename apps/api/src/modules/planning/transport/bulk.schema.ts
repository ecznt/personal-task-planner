import { z } from 'zod';

import type { ValidationProblemItem } from '../../../platform/http/api-problem.exception';

const bulkTaskItemSchema = z.object({
  taskId: z.string().uuid(),
  etag: z.string().min(1),
});

const statusChangeSchema = z.object({
  operation: z.literal('status_change'),
  targetCanonicalStatus: z.enum(['TO_DO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  targetAreaStatusId: z.string().uuid().optional(),
});

const labelChangeSchema = z.object({
  operation: z.literal('label_change'),
  labelAction: z.enum(['add', 'remove']),
  labelIds: z.array(z.string().uuid()).min(1, 'En az bir etiket seçin.'),
});

export const bulkActionsSchema = z.discriminatedUnion('operation', [
  statusChangeSchema,
  labelChangeSchema,
]).and(
  z.object({
    items: z
      .array(bulkTaskItemSchema)
      .min(1, 'En az bir görev seçin.')
      .max(50, 'En fazla 50 görev işlenebilir.'),
  }),
);

export type BulkActionsInput = z.infer<typeof bulkActionsSchema>;

export function parseBulkActionsInput(input: unknown): {
  success: true;
  data: BulkActionsInput;
} | {
  success: false;
  issues: ValidationProblemItem[];
} {
  const result = bulkActionsSchema.safeParse(input);

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
