'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, createAuthSession } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { apiError, AuthApiError, csrfQueryKey, fetchCsrf } from './auth-api';
import { loginFormSchema, type LoginFormValues } from './login-schema';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const form = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginFormSchema),
  });
  const login = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const returnTo = searchParams.get('returnTo');
      const result = await createAuthSession({
        body: {
          email: values.email,
          password: values.password,
          ...(returnTo === null ? {} : { returnTo }),
        },
        client: apiClient,
        headers: { 'X-CSRF-Token': csrf.token },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      if (result.data?.data === undefined) {
        throw new AuthApiError('Oturum açılamadı. Lütfen yeniden deneyin.');
      }

      return result.data.data;
    },
    onSuccess: (session) => {
      router.replace(session.next);
    },
  });
  const verificationRequired =
    login.error instanceof AuthApiError && login.error.code === 'EMAIL_VERIFICATION_REQUIRED';
  const signedOut = searchParams.get('signedOut') === '1';

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => login.mutate(values))}>
      <FieldGroup>
        {signedOut ? (
          <Alert aria-live="polite">
            <AlertTitle>Oturum kapatıldı</AlertTitle>
            <AlertDescription>Bu cihazdaki oturumunuz güvenli biçimde kapatıldı.</AlertDescription>
          </Alert>
        ) : null}

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
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
            {...form.register('password')}
          />
          <FieldError id="password-error" errors={[form.formState.errors.password]} />
        </Field>

        {login.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Oturum açılamadı</AlertTitle>
            <AlertDescription>
              {login.error.message}
              {verificationRequired ? (
                <>
                  {' '}
                  <Link className="underline underline-offset-4" href="/verify-email">
                    E-postanızı doğrulayın
                  </Link>
                </>
              ) : null}
            </AlertDescription>
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
          disabled={login.isPending || csrfQuery.isError}
        >
          {login.isPending ? <Spinner data-icon="inline-start" /> : null}
          {login.isPending ? 'Oturum açılıyor…' : 'Oturum aç'}
        </Button>
      </FieldGroup>
    </form>
  );
}
