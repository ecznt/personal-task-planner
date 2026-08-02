import { z } from 'zod';

export const accountDeletionSchema = z.object({
  acknowledgedPermanentDeletion: z
    .boolean()
    .refine((value) => value, 'Hesap silmenin kalıcı olduğunu onaylamalısınız.'),
  confirmation: z.literal('DELETE_MY_ACCOUNT', {
    error: 'Onay metnini tam olarak DELETE_MY_ACCOUNT yazın.',
  }),
  password: z
    .string()
    .min(1, 'Parolanızı girin.')
    .max(128, 'Parola en fazla 128 karakter olabilir.'),
});

export type AccountDeletionFormValues = z.infer<typeof accountDeletionSchema>;
