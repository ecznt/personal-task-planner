'use client';

import { useEffect } from 'react';

import { isEditableTarget } from './is-editable-target';

export type ShortcutMatch = {
  /**

   * Key as reported by `KeyboardEvent.key` ('k', 'n', 'Enter', ...).
     */
  readonly key: string;
  readonly mod?: boolean;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly alt?: boolean;
  readonly shift?: boolean;
};

export function isShortcutMatch(event: KeyboardEvent, match: ShortcutMatch): boolean {
  if (event.key.toLowerCase() !== match.key) {
    return false;
  }

  const modOnly = match.mod === true;

  if (modOnly) {
    if (!event.metaKey && !event.ctrlKey) {
      return false;
    }
  } else {
    const wantsCtrl = match.ctrl === true;
    const wantsMeta = match.meta === true;
    if (event.ctrlKey !== wantsCtrl || event.metaKey !== wantsMeta) {
      return false;
    }
  }

  const wantsAlt = match.alt === true;
  const wantsShift = match.shift === true;

  if (event.altKey !== wantsAlt || event.shiftKey !== wantsShift) {
    return false;
  }

  return true;
}

export function useKeyboardShortcut(
  match: ShortcutMatch,
  handler: (event: KeyboardEvent) => void,
  options: { readonly ignoreRepeats?: boolean; readonly skipWhenEditable?: boolean } = {},
): void {
  const { ignoreRepeats = false, skipWhenEditable = true } = options;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (ignoreRepeats && event.repeat) {
        return;
      }
      if (skipWhenEditable && isEditableTarget(event.target)) {
        return;
      }
      if (!isShortcutMatch(event, match)) {
        return;
      }

      event.preventDefault();
      handler(event);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handler, ignoreRepeats, match, skipWhenEditable]);
}