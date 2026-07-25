import { z } from 'zod';

const passwordSchema = z.string().superRefine((value, context) => {
  const characterCount = [...value].length;

  if (characterCount < 12) {
    context.addIssue({
      code: 'custom',
      message: 'Parola en az 12 karakter olmalıdır.',
    });
  }

  if (characterCount > 128) {
    context.addIssue({
      code: 'custom',
      message: 'Parola en fazla 128 karakter olmalıdır.',
    });
  }
});

export const registrationFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'E-posta adresi zorunludur.')
      .max(254, 'E-posta adresi en fazla 254 karakter olabilir.')
      .email('Geçerli bir e-posta adresi girin.'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    termsAccepted: z.boolean().refine((value) => value, {
      message: 'Devam etmek için kullanım koşullarını kabul edin.',
    }),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: 'custom',
        message: 'Parolalar eşleşmiyor.',
        path: ['passwordConfirmation'],
      });
    }
  });

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
