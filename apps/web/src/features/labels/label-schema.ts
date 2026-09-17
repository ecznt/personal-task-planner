import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Etiket adı zorunludur.')
    .max(100, 'Etiket adı en fazla 100 karakter olabilir.'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Renk #RRGGBB biçiminde olmalıdır.')
    .nullable()
    .optional(),
});

export type CreateLabelFormValues = z.infer<typeof createLabelSchema>;
