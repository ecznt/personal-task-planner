'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, requestEmailVerification, verifyEmail } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';

import { apiError, csrfQueryKey, fetchCsrf } from './auth-api';
import {
  emailVerificationSchema,
  type EmailVerificationFormValues,
  verificationEmailRequestSchema,
} from './email-verification-schema';

export function EmailVerificationForm() {
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<EmailVerificationFormValues>({
    defaultValues: {
      code: '',
      email: '',
    },
    resolver: zodResolver(emailVerificationSchema),
  });
  const verification = useMutation({
    mutationFn: async ({
      idempotencyKey,
      values,
    }: {
      readonly idempotencyKey: string;
      readonly values: EmailVerificationFormValues;
    }) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await verifyEmail({
        body: values,
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
  });
  const resend = useMutation({
    mutationFn: async (email: string) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await requestEmailVerification({
        body: {
          email,
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

  async function requestFreshCode() {
    const result = verificationEmailRequestSchema.safeParse({
      email: form.getValues('email'),
    });

    if (!result.success) {
      await form.trigger('email');
      return;
    }

    resend.mutate(result.data.email);
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        verification.mutate({
          idempotencyKey: crypto.randomUUID(),
          values,
        }),
      )}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="verification-email">E-posta</FieldLabel>
          <Input
            id="verification-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? 'verification-email-error' : undefined}
            {...form.register('email')}
          />
          <FieldError id="verification-email-error" errors={[form.formState.errors.email]} />
        </Field>

        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="verification-code">8 haneli doğrulama kodu</FieldLabel>
              <InputOTP
                id="verification-code"
                maxLength={8}
                pattern={REGEXP_ONLY_DIGITS}
                autoComplete="one-time-code"
                inputMode="numeric"
                aria-invalid={fieldState.invalid}
                aria-describedby="verification-code-description verification-code-error"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                containerClassName="w-full"
              >
                <InputOTPGroup className="w-full">
                  {Array.from({ length: 8 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} className="h-10 flex-1" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription id="verification-code-description">
                Kod 24 saat geçerlidir. Yeni kod isterseniz önceki kullanılmamış kod geçersiz olur.
              </FieldDescription>
              <FieldError id="verification-code-error" errors={[fieldState.error]} />
            </Field>
          )}
        />

        {verification.isSuccess ? (
          <Alert aria-live="polite">
            <AlertTitle>E-posta doğrulandı</AlertTitle>
            <AlertDescription>
              Hesabınız etkinleştirildi.{' '}
              <Link className="underline underline-offset-4" href="/login">
                Oturum açın
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {verification.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Doğrulama tamamlanamadı</AlertTitle>
            <AlertDescription>{verification.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {resend.isSuccess ? (
          <Alert aria-live="polite">
            <AlertTitle>İstek alındı</AlertTitle>
            <AlertDescription>
              Hesap doğrulamaya uygunsa yeni kod e-posta adresine gönderilecektir.
            </AlertDescription>
          </Alert>
        ) : null}

        {resend.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Yeni kod istenemedi</AlertTitle>
            <AlertDescription>{resend.error.message}</AlertDescription>
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
          disabled={verification.isPending || csrfQuery.isError || verification.isSuccess}
        >
          {verification.isPending ? <Spinner data-icon="inline-start" /> : null}
          {verification.isPending ? 'Doğrulanıyor…' : 'E-postayı doğrula'}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resend.isPending || csrfQuery.isError || verification.isSuccess}
          onClick={() => void requestFreshCode()}
        >
          {resend.isPending ? <Spinner data-icon="inline-start" /> : null}
          {resend.isPending ? 'Yeni kod isteniyor…' : 'Yeni kod gönder'}
        </Button>
      </FieldGroup>
    </form>
  );
}
