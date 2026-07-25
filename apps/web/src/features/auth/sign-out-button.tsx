'use client';

import { apiClient, deleteAuthSession } from '@planner/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { apiError, csrfQueryKey, fetchCsrf } from './auth-api';

export function SignOutButton({
  navigate = replaceDocument,
}: Readonly<{ navigate?: ((path: string) => void) | undefined }>) {
  const queryClient = useQueryClient();
  const csrfQuery = useQuery({
    queryKey: csrfQueryKey,
    queryFn: fetchCsrf,
    staleTime: 20 * 60 * 1_000,
  });
  const logout = useMutation({
    mutationFn: async () => {
      const csrf = csrfQuery.data ?? (await fetchCsrf());
      queryClient.setQueryData(csrfQueryKey, csrf);
      const result = await deleteAuthSession({
        client: apiClient,
        headers: {
          'X-CSRF-Token': csrf.token,
        },
      });

      if (result.error !== undefined) {
        throw apiError(result.error);
      }
    },
    onSuccess: () => {
      navigate('/login?signedOut=1');
    },
  });

  return (
    <div className="flex flex-col items-start gap-3">
      {logout.isError ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Oturum kapatılamadı</AlertTitle>
          <AlertDescription>
            Oturumunuzun sunucuda kapatıldığı doğrulanamadı. Lütfen yeniden deneyin.
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
        type="button"
        variant="outline"
        disabled={logout.isPending || csrfQuery.isError}
        onClick={() => logout.mutate()}
      >
        {logout.isPending ? <Spinner data-icon="inline-start" /> : null}
        {logout.isPending ? 'Oturum kapatılıyor…' : 'Oturumu kapat'}
      </Button>
    </div>
  );
}

function replaceDocument(path: string): void {
  window.location.replace(path);
}
