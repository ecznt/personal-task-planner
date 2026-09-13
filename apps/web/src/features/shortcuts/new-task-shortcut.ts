'use client';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

export function useNewTaskShortcut(): void {
  useKeyboardShortcut(
    { key: 'n' },
    () => {
      window.dispatchEvent(new CustomEvent('planner:new-task'));
    },
    { ignoreRepeats: true },
  );
}