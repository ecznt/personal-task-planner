'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  apiClient,
  completeCurrentUserOnboarding,
  getCurrentUser,
  updateCurrentUser,
} from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiError, csrfQueryKey, fetchCsrf } from '@/features/auth/auth-api';

import {
  onboardingPreferenceSchema,
  type OnboardingPreferenceFormValues,
} from './onboarding-preference-schema';

type CurrentUserForOnboarding = {
  readonly email: string;
  readonly etag: string;
  readonly onboardingState: 'PENDING' | 'COMPLETED';
  readonly timeZone: string;
};

const fallbackTimeZones = ['Europe/Istanbul', 'UTC', 'Europe/London', 'America/New_York'] as const;

export function OnboardingPreferenceForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentUser = useQuery({
    queryKey: ['users', 'me', 'onboarding'],
    queryFn: readCurrentUserForOnboarding,
  });
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const browserTimeZone = useMemo(() => detectedBrowserTimeZone(), []);
  const timeZoneOptions = useMemo(
    () =>
      uniqueValues([currentUser.data?.timeZone, browserTimeZone, ...fallbackTimeZones]).filter(
        isSupportedTimeZone,
      ),
    [browserTimeZone, currentUser.data?.timeZone],
  );
  const form = useForm<OnboardingPreferenceFormValues>({
    defaultValues: {
      choice: 'START_EMPTY',
      timeZone: currentUser.data?.timeZone ?? browserTimeZone,
    },
    resolver: zodResolver(onboardingPreferenceSchema),
    values: {
      choice: 'START_EMPTY',
      timeZone: currentUser.data?.timeZone ?? browserTimeZone,
    },
  });
  const selectedChoice = useWatch({
    control: form.control,
    name: 'choice',
  });
  const confirmation = useMutation({
    mutationFn: async (values: OnboardingPreferenceFormValues) => {
      if (currentUser.data === undefined) {
        throw new Error('Hesap bilgisi alınamadı.');
      }

      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const result = await updateCurrentUser({
        body: {
          timeZone: values.timeZone,
        },
        client: apiClient,
        headers: {
          'If-Match': currentUser.data.etag,
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      const etag = result.response?.headers.get('etag');
      if (result.data?.data === undefined || etag === null || etag === undefined) {
        throw new Error('Tercihler kaydedilemedi.');
      }

      const completion = await completeCurrentUserOnboarding({
        body: {
          choice: values.choice,
        },
        client: apiClient,
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
          'If-Match': etag,
          'X-CSRF-Token': csrf.token,
        },
      });

      if (completion.error !== undefined) {
        throw apiError(completion.error);
      }

      const completedEtag = completion.response?.headers.get('etag');
      if (
        completion.data?.data === undefined ||
        completedEtag === null ||
        completedEtag === undefined
      ) {
        throw new Error('Onboarding tamamlanamadı.');
      }

      return {
        choice: values.choice,
        etag: completedEtag,
        next: completion.data.data.next,
        profile: completion.data.data.user,
      };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['users', 'me', 'onboarding'], {
        email: result.profile.email,
        etag: result.etag,
        onboardingState: result.profile.onboardingState,
        timeZone: result.profile.timeZone,
      } satisfies CurrentUserForOnboarding);

      router.push(result.next);
    },
  });

  if (currentUser.isPending) {
    return (
      <p className="flex items-center gap-2" role="status">
        <Spinner /> Onboarding tercihleri yükleniyor…
      </p>
    );
  }

  if (currentUser.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Onboarding bilgisi alınamadı</AlertTitle>
        <AlertDescription>Sayfayı yenileyin veya yeniden oturum açın.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Başlangıç tercihinizi onaylayın
        </CardTitle>
        <CardDescription>
          {currentUser.data.email} hesabı için saat dilimini kaydedin. Boş başlayabilir veya size
          ait düzenlenebilir örnek veriyi oluşturabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={form.handleSubmit((values) => confirmation.mutate(values))}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.choice)}>
              <FieldLabel htmlFor="onboarding-choice">Başlangıç tercihi</FieldLabel>
              <Select
                id="onboarding-choice"
                className="h-9"
                aria-invalid={Boolean(form.formState.errors.choice)}
                aria-describedby={
                  form.formState.errors.choice ? 'onboarding-choice-error' : undefined
                }
                {...form.register('choice')}
              >
                <option value="START_EMPTY">Boş başla</option>
                <option value="CREATE_SAMPLE_DATA">Örnek veri oluştur</option>
              </Select>
              <FieldError id="onboarding-choice-error" errors={[form.formState.errors.choice]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.timeZone)}>
              <FieldLabel htmlFor="onboarding-time-zone">Saat dilimi</FieldLabel>
              <Select
                id="onboarding-time-zone"
                className="h-9"
                aria-invalid={Boolean(form.formState.errors.timeZone)}
                aria-describedby={
                  form.formState.errors.timeZone ? 'onboarding-time-zone-error' : undefined
                }
                {...form.register('timeZone')}
              >
                {timeZoneOptions.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </Select>
              <FieldError
                id="onboarding-time-zone-error"
                errors={[form.formState.errors.timeZone]}
              />
            </Field>

            {confirmation.isSuccess ? (
              <Alert aria-live="polite">
                <AlertTitle>Tercih ve saat dilimi onaylandı</AlertTitle>
                <AlertDescription>
                  {confirmation.data.choice === 'START_EMPTY'
                    ? 'Boş başlangıç tamamlandı. Today ekranına yönlendiriliyorsunuz.'
                    : 'Örnek veriniz oluşturuldu. Today ekranına yönlendiriliyorsunuz.'}
                </AlertDescription>
              </Alert>
            ) : null}

            {confirmation.isError ? (
              <Alert variant="destructive" aria-live="polite">
                <AlertTitle>Tercihler kaydedilemedi</AlertTitle>
                <AlertDescription>
                  {confirmation.error.message || 'Bilgileri kontrol edip yeniden deneyin.'}
                </AlertDescription>
              </Alert>
            ) : null}

            {csrfQuery.isError ? (
              <Alert variant="destructive" aria-live="polite">
                <AlertTitle>Güvenli bağlantı kurulamadı</AlertTitle>
                <AlertDescription>
                  Sayfayı yenileyin veya kısa süre sonra yeniden deneyin.
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={confirmation.isPending || csrfQuery.isError}>
              {confirmation.isPending ? <Spinner data-icon="inline-start" /> : null}
              {confirmation.isPending
                ? 'Kaydediliyor…'
                : submitLabel(selectedChoice ?? 'START_EMPTY')}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

async function readCurrentUserForOnboarding(): Promise<CurrentUserForOnboarding> {
  const result = await getCurrentUser({ client: apiClient });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  const etag = result.response?.headers.get('etag');

  if (result.data?.data === undefined || etag === null || etag === undefined) {
    throw new Error('Onboarding bilgisi alınamadı.');
  }

  return {
    email: result.data.data.email,
    etag,
    onboardingState: result.data.data.onboardingState,
    timeZone: result.data.data.timeZone,
  };
}

function detectedBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
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

function uniqueValues(values: ReadonlyArray<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => value !== undefined))];
}

function submitLabel(choice: OnboardingPreferenceFormValues['choice']): string {
  return choice === 'START_EMPTY'
    ? 'Boş başla ve Today’e geç'
    : 'Örnek veri oluştur ve Today’e geç';
}
