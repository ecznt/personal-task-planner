import { z } from 'zod';

export const addChecklistItemSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Madde başlığı zorunludur.')
    .max(500, 'Madde başlığı en fazla 500 karakter olabilir.'),
});

export type AddChecklistItemFormValues = z.infer<typeof addChecklistItemSchema>;
