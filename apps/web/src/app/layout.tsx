import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'Kişisel İş Planlayıcı',
  description: 'Kişisel işlerinizi planlamak için hazırlanan uygulama.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
