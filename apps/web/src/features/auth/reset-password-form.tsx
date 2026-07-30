'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, resetPassword } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { apiError, csrfQueryKey, fetchCsrf } from './auth-api';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from './password-reset-schema';

export function ResetPasswordForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState(readInitialResetToken);
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
    resolver: zodResolver(resetPasswordFormSchema),
  });
  const reset = useMutation({
    mutationFn: async ({
      idempotencyKey,
      values,
    }: {
      readonly idempotencyKey: string;
      readonly values: ResetPasswordFormValues;
    }) => {
      if (token === null) {
        throw new Error('Parola sıfırlama bağlantısı geçersiz.');
      }

      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await resetPassword({
        body: {
          password: values.password,
          passwordConfirmation: values.passwordConfirmation,
          token,
        },
        client: apiClient,
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      router.replace('/login?passwordReset=1');
    },
  });

  useEffect(() => {
    if (window.location.hash.length > 0) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (token === null) {
    return (
      <Alert variant="destructive" aria-live="polite">
        <AlertTitle>Bağlantı geçersiz</AlertTitle>
        <AlertDescription>
          Yeni bir parola sıfırlama bağlantısı isteyin.{' '}
          <Link className="underline underline-offset-4" href="/forgot-password">
            Bağlantı gönder
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        reset.mutate({
          idempotencyKey: crypto.randomUUID(),
          values,
        }),
      )}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="new-password">Yeni parola</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby="new-password-description new-password-error"
            {...form.register('password')}
          />
          <FieldDescription id="new-password-description">
            12–128 karakter kullanın. Parola yöneticisi ve yapıştırma desteklenir.
          </FieldDescription>
          <FieldError id="new-password-error" errors={[form.formState.errors.password]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.passwordConfirmation)}>
          <FieldLabel htmlFor="new-password-confirmation">Yeni parola tekrarı</FieldLabel>
          <Input
            id="new-password-confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.passwordConfirmation)}
            aria-describedby={
              form.formState.errors.passwordConfirmation
                ? 'new-password-confirmation-error'
                : undefined
            }
            {...form.register('passwordConfirmation')}
          />
          <FieldError
            id="new-password-confirmation-error"
            errors={[form.formState.errors.passwordConfirmation]}
          />
        </Field>

        {reset.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Parola sıfırlanamadı</AlertTitle>
            <AlertDescription>{reset.error.message}</AlertDescription>
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
          disabled={reset.isPending || csrfQuery.isError || token === null}
        >
          {reset.isPending ? <Spinner data-icon="inline-start" /> : null}
          {reset.isPending ? 'Parola kaydediliyor…' : 'Yeni parolayı kaydet'}
        </Button>
      </FieldGroup>
    </form>
  );
}

function readInitialResetToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const parameters = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return parameters.get('token');
}
