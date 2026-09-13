import { z } from 'zod';

import {
  ApiProblemException,
  type ValidationProblemItem,
} from '../../../platform/http/api-problem.exception';

const userProfilePatchSchema = z
  .strictObject({
    inAppReminderNotificationsEnabled: z.boolean().optional(),
    timeZone: z
      .string()
      .trim()
      .min(1, 'Saat dilimi zorunludur.')
      .max(100, 'Saat dilimi en fazla 100 karakter olabilir.')
      .refine(isSupportedTimeZone, 'Geçerli bir IANA saat dilimi seçin.')
      .optional(),
  })
  .superRefine((value, context) => {
    const hasTimeZone = value.timeZone !== undefined;
    const hasNotifications = value.inAppReminderNotificationsEnabled !== undefined;

    if (hasTimeZone === hasNotifications) {
      context.addIssue({
        code: 'custom',
        message: 'Saat dilimi veya bildirim tercihinden yalnızca birini güncelleyebilirsiniz.',
        path: [],
      });
    }
  });

export type UserProfilePatchInput = z.infer<typeof userProfilePatchSchema>;

export function parseUserProfilePatch(value: unknown): UserProfilePatchInput {
  const result = userProfilePatchSchema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw new ApiProblemException({
    status: 422,
    code: 'VALIDATION_FAILED',
    detail: 'Hesap tercihlerini kontrol edin.',
    errors: result.error.issues.map(toValidationProblem),
  });
}

function isSupportedTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: value,
    }).format(new Date('2026-01-01T00:00:00.000Z'));
    return true;
  } catch {
    return false;
  }
}

function toValidationProblem(issue: z.core.$ZodIssue): ValidationProblemItem {
  return {
    code: zodIssueCode(issue),
    path: toJsonPointer(issue.path),
    message: issue.message,
  };
}

const onboardingCompletionSchema = z
  .object({
    choice: z.enum(['CREATE_SAMPLE_DATA', 'START_EMPTY']),
  })
  .strict();

export type OnboardingCompletionInput = z.infer<typeof onboardingCompletionSchema>;

export function parseOnboardingCompletion(value: unknown): OnboardingCompletionInput {
  const result = onboardingCompletionSchema.safeParse(value);

  if (!result.success) {
    throw new ApiProblemException({
      status: 422,
      code: 'VALIDATION_FAILED',
      detail: 'Onboarding tamamlama bilgisini kontrol edin.',
      errors: [
        {
          code: 'INVALID_ONBOARDING_CHOICE',
          message: 'Başlangıç tercihi START_EMPTY veya CREATE_SAMPLE_DATA olmalıdır.',
          path: '/body/choice',
        },
      ],
    });
  }

  return result.data;
}

function zodIssueCode(issue: z.core.$ZodIssue): string {
  if (issue.code === 'too_small') {
    return 'TOO_SHORT';
  }

  if (issue.code === 'too_big') {
    return 'TOO_LONG';
  }

  if (issue.code === 'custom') {
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
