import { z } from 'zod';

export const emailVerificationSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta adresi zorunludur.')
    .max(254, 'E-posta adresi en fazla 254 karakter olabilir.')
    .email('Geçerli bir e-posta adresi girin.'),
  code: z.string().regex(/^\d{8}$/, 'Doğrulama kodu 8 rakamdan oluşmalıdır.'),
});

export const verificationEmailRequestSchema = emailVerificationSchema.pick({
  email: true,
});

export type EmailVerificationFormValues = z.infer<typeof emailVerificationSchema>;
