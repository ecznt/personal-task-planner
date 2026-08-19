import { z } from 'zod';

export const createAreaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Alan adı zorunludur.')
    .max(100, 'Alan adı en fazla 100 karakter olabilir.'),
});

export type CreateAreaFormValues = z.infer<typeof createAreaSchema>;

export const renameAreaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Alan adı zorunludur.')
    .max(100, 'Alan adı en fazla 100 karakter olabilir.'),
});

export type RenameAreaFormValues = z.infer<typeof renameAreaSchema>;
