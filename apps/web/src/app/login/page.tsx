import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Oturum aç | Kişisel İş Planlayıcı',
  description: 'Kişisel planlama alanınıza güvenli biçimde erişin.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl" role="heading" aria-level={1}>
            Oturum aç
          </CardTitle>
          <CardDescription>Yalnızca size ait planlama alanınıza devam edin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Suspense fallback={<p role="status">Giriş formu hazırlanıyor…</p>}>
            <LoginForm />
          </Suspense>
          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{' '}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href="/register"
            >
              Hesap oluşturun
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
