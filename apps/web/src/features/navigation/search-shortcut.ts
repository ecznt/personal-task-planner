'use client';

import { usePathname, useRouter } from 'next/navigation';

import { useKeyboardShortcut } from '@/features/shortcuts/use-keyboard-shortcut';

export function useSearchShortcut(targetSelector = '#app-search-input'): void {
  const router = useRouter();
  const pathname = usePathname();

  useKeyboardShortcut(
    { key: '/' },
    () => {
      if (pathname.startsWith('/app/search')) {
        const input = document.querySelector<HTMLInputElement>(targetSelector);
        if (input !== null) {
          input.focus();
        }
        return;
      }
      router.push('/app/search');
    },
    { ignoreRepeats: true },
  );
}