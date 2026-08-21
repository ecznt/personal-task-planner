import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Proje adı zorunludur.')
    .max(100, 'Proje adı en fazla 100 karakter olabilir.'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
