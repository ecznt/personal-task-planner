'use client';

import { createContext } from 'react';

import type { ActiveFocus } from './focus-types';

export type FocusContextValue = {
  readonly active: ActiveFocus | null;
  readonly remainingMs: number;
  readonly progress: number;
  readonly isOpen: boolean;
  readonly startFocus: (minutes: number) => void;
  readonly cancelFocus: () => void;
  readonly openFocus: () => void;
  readonly closeFocus: () => void;
};

export const focusContextDefault: FocusContextValue = {
  active: null,
  remainingMs: 0,
  progress: 0,
  isOpen: false,
  startFocus: () => undefined,
  cancelFocus: () => undefined,
  openFocus: () => undefined,
  closeFocus: () => undefined,
};

export const FocusContext = createContext<FocusContextValue>(focusContextDefault);