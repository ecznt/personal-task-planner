'use client';

import { useContext } from 'react';

import { FocusContext } from './focus-context';

export function useFocus() {
  return useContext(FocusContext);
}