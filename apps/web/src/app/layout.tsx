import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { AppProviders } from './providers';
import { ThemeProvider } from '@/components/theme/theme-provider';

export const metadata: Metadata = {
  title: 'Kişisel İş Planlayıcı',
  description: 'Kişisel işlerinizi planlamak için hazırlanan uygulama.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
