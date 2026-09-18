'use client';

import { createContext, useContext } from 'react';

export type TaskInspectorContextValue = {
  readonly openTask: (taskId: string) => void;
  readonly closeTask: () => void;
};

export const TaskInspectorContext = createContext<TaskInspectorContextValue | null>(null);

export function useTaskInspector(): TaskInspectorContextValue {
  const context = useContext(TaskInspectorContext);

  if (context === null) {
    throw new Error('useTaskInspector yalnızca TaskInspectorProvider içinde kullanılabilir.');
  }

  return context;
}