'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, getAuthCsrf, registerAccount } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { registrationFormSchema, type RegistrationFormValues } from './registration-schema';

const csrfQueryKey = ['auth', 'csrf'] as const;

type CsrfData = {
  readonly token: string;
  readonly expiresAt: string;
};

export function RegistrationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<RegistrationFormValues>({
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
      termsAccepted: false,
    },
    resolver: zodResolver(registrationFormSchema),
  });
  const registration = useMutation({
    mutationFn: async (values: RegistrationFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await registerAccount({
        body: {
          email: values.email,
          password: values.password,
          passwordConfirmation: values.passwordConfirmation,
          termsAccepted: true,
        },
        client: apiClient,
        headers: {
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      router.push('/verify-email');
    },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => registration.mutate(values))}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            {...form.register('email')}
          />
          <FieldError id="email-error" errors={[form.formState.errors.email]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="password">Parola</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby="password-description password-error"
            {...form.register('password')}
          />
          <FieldDescription id="password-description">
            12–128 karakter kullanın. Parola yöneticisi ve yapıştırma desteklenir.
          </FieldDescription>
          <FieldError id="password-error" errors={[form.formState.errors.password]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.passwordConfirmation)}>
          <FieldLabel htmlFor="password-confirmation">Parola tekrarı</FieldLabel>
          <Input
            id="password-confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.passwordConfirmation)}
            aria-describedby={
              form.formState.errors.passwordConfirmation ? 'password-confirmation-error' : undefined
            }
            {...form.register('passwordConfirmation')}
          />
          <FieldError
            id="password-confirmation-error"
            errors={[form.formState.errors.passwordConfirmation]}
          />
        </Field>

        <Controller
          control={form.control}
          name="termsAccepted"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid}
              className="items-start"
            >
              <Checkbox
                id="terms-accepted"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? 'terms-error' : undefined}
              />
              <div className="grid gap-1">
                <FieldLabel htmlFor="terms-accepted">
                  Kullanım koşullarını kabul ediyorum.
                </FieldLabel>
                <FieldError id="terms-error" errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />

        {registration.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Kayıt tamamlanamadı</AlertTitle>
            <AlertDescription>{registration.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {csrfQuery.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Güvenli bağlantı kurulamadı</AlertTitle>
            <AlertDescription>
              Sayfayı yenileyin veya kısa bir süre sonra yeniden deneyin.
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={registration.isPending || csrfQuery.isError}
        >
          {registration.isPending ? <Spinner data-icon="inline-start" /> : null}
          {registration.isPending ? 'Hesap hazırlanıyor…' : 'Hesap oluştur'}
        </Button>
      </FieldGroup>
    </form>
  );
}

async function fetchCsrf(): Promise<CsrfData> {
  const result = await getAuthCsrf({
    client: apiClient,
  });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  if (result.data?.data === undefined) {
    throw new Error('Güvenli bağlantı kurulamadı.');
  }

  return result.data.data;
}

function apiError(value: unknown): Error {
  if (
    typeof value === 'object' &&
    value !== null &&
    'detail' in value &&
    typeof value.detail === 'string'
  ) {
    return new Error(value.detail);
  }

  return new Error('İşlem tamamlanamadı. Lütfen yeniden deneyin.');
}
