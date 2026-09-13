'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="grid min-h-dvh place-items-center bg-background text-foreground">
        <main className="grid gap-5 justify-items-center p-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">HATA</p>
          <h1 className="text-2xl font-semibold">Bir şeyler ters gitti</h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya daha sonra geri gelin.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}