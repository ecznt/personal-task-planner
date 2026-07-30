'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, requestPasswordReset } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { apiError, csrfQueryKey, fetchCsrf } from './auth-api';
import {
  passwordResetRequestFormSchema,
  type PasswordResetRequestFormValues,
} from './password-reset-schema';

export function PasswordResetRequestForm() {
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<PasswordResetRequestFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(passwordResetRequestFormSchema),
  });
  const requestReset = useMutation({
    mutationFn: async (values: PasswordResetRequestFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await requestPasswordReset({
        body: {
          email: values.email,
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
  });

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => requestReset.mutate(values))}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="password-reset-email">E-posta</FieldLabel>
          <Input
            id="password-reset-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={
              form.formState.errors.email ? 'password-reset-email-error' : undefined
            }
            {...form.register('email')}
          />
          <FieldError id="password-reset-email-error" errors={[form.formState.errors.email]} />
        </Field>

        {requestReset.isSuccess ? (
          <Alert aria-live="polite">
            <AlertTitle>İstek alındı</AlertTitle>
            <AlertDescription>
              Hesap parola sıfırlamaya uygunsa bağlantı e-posta adresine gönderilecektir.
            </AlertDescription>
          </Alert>
        ) : null}

        {requestReset.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>İstek gönderilemedi</AlertTitle>
            <AlertDescription>{requestReset.error.message}</AlertDescription>
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
          disabled={requestReset.isPending || csrfQuery.isError}
        >
          {requestReset.isPending ? <Spinner data-icon="inline-start" /> : null}
          {requestReset.isPending ? 'Bağlantı isteniyor…' : 'Sıfırlama bağlantısı gönder'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Parolanızı hatırladınız mı?{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
            Oturum açın
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
