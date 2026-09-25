'use client';

import { SproutIcon } from 'lucide-react';

import { useFocus } from './use-focus';

export function FocusTrigger() {
  const { openFocus } = useFocus();

  return (
    <button
      type="button"
      onClick={openFocus}
      aria-label="Odak zamanlayıcıyı aç"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.97]"
    >
      <SproutIcon className="size-4" aria-hidden="true" />
    </button>
  );
}