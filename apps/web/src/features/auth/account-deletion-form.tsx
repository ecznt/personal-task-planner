'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  apiClient,
  getCurrentUser,
  initiateAccountDeletion,
  reauthenticate,
} from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { accountDeletionSchema, type AccountDeletionFormValues } from './account-deletion-schema';
import { apiError, csrfQueryKey, fetchCsrf } from './auth-api';

type CurrentUserForDeletion = {
  readonly email: string;
  readonly etag: string;
};

export function AccountDeletionForm({
  navigate = replaceDocument,
}: Readonly<{ navigate?: ((path: string) => void) | undefined }>) {
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const currentUser = useQuery({
    queryKey: ['users', 'me', 'account-deletion'],
    queryFn: readCurrentUserForDeletion,
  });
  const form = useForm<AccountDeletionFormValues>({
    defaultValues: {
      acknowledgedPermanentDeletion: false,
      confirmation: '' as 'DELETE_MY_ACCOUNT',
      password: '',
    },
    resolver: zodResolver(accountDeletionSchema),
  });
  const deletion = useMutation({
    mutationFn: async (values: AccountDeletionFormValues) => {
      if (currentUser.data === undefined) {
        throw new Error('Hesap bilgisi alınamadı.');
      }

      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);

      const reauth = await reauthenticate({
        body: {
          action: 'ACCOUNT_DELETION',
          password: values.password,
        },
        client: apiClient,
        headers: {
          'X-CSRF-Token': csrf.token,
        },
      });

      if (reauth.error !== undefined) {
        throw apiError(reauth.error);
      }

      const result = await initiateAccountDeletion({
        body: {
          acknowledgedPermanentDeletion: true,
          confirmation: values.confirmation,
        },
        client: apiClient,
        headers: {
          'Idempotency-Key': createIdempotencyKey(),
          'If-Match': currentUser.data.etag,
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }

      return result.data?.data;
    },
    onSuccess: () => {
      navigate('/account-deletion-started');
    },
  });

  if (currentUser.isPending) {
    return (
      <p className="flex items-center gap-2" role="status">
        <Spinner /> Hesap bilgisi yükleniyor…
      </p>
    );
  }

  if (currentUser.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Hesap bilgisi alınamadı</AlertTitle>
        <AlertDescription>Sayfayı yenileyin veya yeniden oturum açın.</AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => deletion.mutate(values))}
      className="flex flex-col gap-6"
    >
      <Alert variant="destructive">
        <AlertTitle>Tehlikeli işlem: hesabı sil</AlertTitle>
        <AlertDescription>
          {currentUser.data.email} hesabı için erişim hemen kapatılır. Primary data purge ayrı ve
          retry-safe süreçte tamamlanır; bu sırada tekrar oturum açamazsınız.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="account-deletion-password">Parolanız</FieldLabel>
          <Input
            id="account-deletion-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby={
              form.formState.errors.password ? 'account-deletion-password-error' : undefined
            }
            {...form.register('password')}
          />
          <FieldError
            id="account-deletion-password-error"
            errors={[form.formState.errors.password]}
          />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.confirmation)}>
          <FieldLabel htmlFor="account-deletion-confirmation">
            Onay metni: DELETE_MY_ACCOUNT
          </FieldLabel>
          <Input
            id="account-deletion-confirmation"
            autoComplete="off"
            aria-invalid={Boolean(form.formState.errors.confirmation)}
            aria-describedby={
              form.formState.errors.confirmation ? 'account-deletion-confirmation-error' : undefined
            }
            {...form.register('confirmation')}
          />
          <FieldError
            id="account-deletion-confirmation-error"
            errors={[form.formState.errors.confirmation]}
          />
        </Field>

        <Controller
          control={form.control}
          name="acknowledgedPermanentDeletion"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="account-deletion-acknowledgement"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                  aria-invalid={fieldState.invalid}
                  aria-describedby="account-deletion-acknowledgement-error"
                />
                <FieldLabel htmlFor="account-deletion-acknowledgement" className="leading-5">
                  Hesap silme işleminin kalıcı olduğunu ve erişimin hemen kapatılacağını anlıyorum.
                </FieldLabel>
              </div>
              <FieldError id="account-deletion-acknowledgement-error" errors={[fieldState.error]} />
            </Field>
          )}
        />

        {deletion.isError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>Hesap silme başlatılamadı</AlertTitle>
            <AlertDescription>
              {deletion.error.message || 'Bilgileri kontrol edip yeniden deneyin.'}
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
          variant="destructive"
          disabled={deletion.isPending || csrfQuery.isError}
        >
          {deletion.isPending ? <Spinner data-icon="inline-start" /> : null}
          {deletion.isPending ? 'Hesap silme başlatılıyor…' : 'Hesabımı sil'}
        </Button>
      </FieldGroup>
    </form>
  );
}

async function readCurrentUserForDeletion(): Promise<CurrentUserForDeletion> {
  const result = await getCurrentUser({ client: apiClient });

  if (result.error !== undefined) {
    throw apiError(result.error);
  }

  const etag = result.response?.headers.get('etag');

  if (result.data?.data === undefined || etag === null || etag === undefined) {
    throw new Error('Hesap bilgisi alınamadı.');
  }

  return {
    email: result.data.data.email,
    etag,
  };
}

function createIdempotencyKey(): string {
  if (globalThis.crypto?.randomUUID !== undefined) {
    return globalThis.crypto.randomUUID();
  }

  return `account-deletion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function replaceDocument(path: string): void {
  window.location.replace(path);
}
