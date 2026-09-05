'use client';

import { apiClient, getAuthSession } from '@planner/api-client';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { SignOutButton } from './sign-out-button';

type SessionBoundaryProps = {
  children?: ReactNode;
  returnTo?: string;
};

export function SessionBoundary({ children }: SessionBoundaryProps) {
  const pathname = usePathname();
  const session = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const result = await getAuthSession({ client: apiClient });
      if (result.error !== undefined || result.data?.data === undefined) {
        throw new Error('Oturum bilgisi alınamadı.');
      }
      return result.data.data;
    },
  });

  useEffect(() => {
    if (session.data?.authenticated === false) {
      window.location.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, session.data?.authenticated]);

  if (session.isPending || session.data?.authenticated === false) {
    return (
      <p className="flex items-center gap-2" role="status">
        <Spinner /> Oturum kontrol ediliyor…
      </p>
    );
  }

  if (session.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Oturum kontrol edilemedi</AlertTitle>
        <AlertDescription>Sayfayı yenileyin veya yeniden oturum açın.</AlertDescription>
      </Alert>
    );
  }

  if (children !== undefined) {
    return children;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={1}>
          Oturumunuz açık
        </CardTitle>
        <CardDescription>{session.data.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>
          Today planlama deneyimi sonraki dikey dilimlerde oluşturulacak. Güvenli oturum handoff’u
          hazır.
        </p>
        <SignOutButton />
      </CardContent>
    </Card>
  );
}
