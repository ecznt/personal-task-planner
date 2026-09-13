import { z } from 'zod';

export const createTaskChecklistItemSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Madde metni zorunludur.')
    .max(1000, 'Madde metni en fazla 1000 karakter olabilir.'),
});

export const createTaskRecurrenceSchema = z.object({
  mode: z.enum(['CALENDAR_BASED', 'COMPLETION_BASED']),
  frequency: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1),
  selectedWeekdays: z.array(z.number().int().min(1).max(7)),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  monthOfYear: z.number().int().min(1).max(12).nullable().optional(),
  localTime: z.string().nullable().optional(),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Görev başlığı zorunludur.')
    .max(500, 'Görev başlığı en fazla 500 karakter olabilir.'),
  description: z.string().max(5000, 'Görev açıklaması en fazla 5000 karakter olabilir.').optional(),
  plannedAt: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  projectId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
  checklistItems: z
    .array(createTaskChecklistItemSchema)
    .max(100, 'En fazla 100 kontrol maddesi eklenebilir.')
    .optional(),
  recurrence: createTaskRecurrenceSchema.nullable().optional(),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
export type CreateTaskChecklistItemValues = z.infer<typeof createTaskChecklistItemSchema>;
export type CreateTaskRecurrenceValues = z.infer<typeof createTaskRecurrenceSchema>;

export const editTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Görev başlığı zorunludur.')
    .max(500, 'Görev başlığı en fazla 500 karakter olabilir.')
    .optional(),
  description: z.string().max(5000, 'Görev açıklaması en fazla 5000 karakter olabilir.').optional(),
  plannedAt: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  projectId: z.string().optional(),
});

export type EditTaskFormValues = z.infer<typeof editTaskSchema>;
