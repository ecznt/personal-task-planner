import { z } from 'zod';

export const templatePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createTemplateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Şablon adı zorunludur.')
    .max(200, 'Şablon adı en fazla 200 karakter olabilir.'),
  description: z.string().trim().max(5000, 'Açıklama en fazla 5000 karakter olabilir.').optional(),
  priority: templatePrioritySchema.default('MEDIUM'),
  checklistSteps: z.array(z.string().trim().min(1)).max(100, 'En fazla 100 adım olabilir.'),
  labelNames: z.array(z.string().trim().min(1)).max(50, 'En fazla 50 etiket olabilir.'),
  defaultPlannedAtOffsetDays: z.coerce.number().int().min(0).max(365).optional(),
});

export type CreateTemplateFormValues = z.input<typeof createTemplateSchema>;

export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function splitCommaSeparated(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}