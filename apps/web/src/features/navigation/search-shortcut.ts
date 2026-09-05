'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  );
}

export function useSearchShortcut(targetSelector = '#app-search-input'): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== '/' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      if (pathname.startsWith('/app/search')) {
        const input = document.querySelector<HTMLInputElement>(targetSelector);
        if (input !== null) {
          input.focus();
        }
        return;
      }
      router.push('/app/search');
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pathname, router, targetSelector]);
}
