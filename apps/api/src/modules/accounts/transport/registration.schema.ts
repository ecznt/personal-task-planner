import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

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

const registrationSchema = z
  .strictObject({
    email: z
      .string()
      .trim()
      .min(1, 'E-posta adresi zorunludur.')
      .max(254, 'E-posta adresi en fazla 254 karakter olabilir.')
      .email('Geçerli bir e-posta adresi girin.'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    termsAccepted: z.literal(true, {
      error: 'Devam etmek için kullanım koşullarını kabul edin.',
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

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function parseRegistrationInput(value: unknown): RegistrationInput {
  const result = registrationSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Gönderilen kayıt bilgilerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: zodIssueCode(issue),
    path: toJsonPointer(issue.path),
    message: issue.message,
  };
}

function zodIssueCode(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_format') {
    return 'INVALID_FORMAT';
  }

  if (issue.code === 'too_small') {
    return 'TOO_SHORT';
  }

  if (issue.code === 'too_big') {
    return 'TOO_LONG';
  }

  if (issue.code === 'invalid_value') {
    return 'INVALID_VALUE';
  }

  return 'INVALID_INPUT';
}

function toJsonPointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return '/';
  }

  return `/${path
    .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')}`;
}
