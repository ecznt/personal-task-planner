import { z } from 'zod';

export const onboardingPreferenceSchema = z.object({
  choice: z.enum(['START_EMPTY', 'CREATE_SAMPLE_DATA'], {
    error: 'Başlangıç tercihinizi seçin.',
  }),
  timeZone: z
    .string()
    .trim()
    .min(1, 'Saat dilimi zorunludur.')
    .max(100, 'Saat dilimi en fazla 100 karakter olabilir.'),
});

export type OnboardingPreferenceFormValues = z.infer<typeof onboardingPreferenceSchema>;
