import { z } from 'zod';

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
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

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
});

export type EditTaskFormValues = z.infer<typeof editTaskSchema>;
