import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta adresi zorunludur.')
    .max(254, 'E-posta adresi en fazla 254 karakter olabilir.')
    .email('Geçerli bir e-posta adresi girin.'),
  password: z
    .string()
    .min(1, 'Parola zorunludur.')
    .max(128, 'Parola en fazla 128 karakter olabilir.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
