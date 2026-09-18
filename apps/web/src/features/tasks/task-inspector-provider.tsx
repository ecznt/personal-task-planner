'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

import { TaskInspector } from './task-inspector';
import { TaskInspectorContext } from './task-inspector-context';

export function TaskInspectorProvider({ children }: { readonly children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null);

  const openTask = useCallback((nextTaskId: string) => {
    setTaskId(nextTaskId);
  }, []);

  const closeTask = useCallback(() => {
    setTaskId(null);
  }, []);

  return (
    <TaskInspectorContext.Provider value={{ openTask, closeTask }}>
      {children}
      <Sheet open={taskId !== null} onOpenChange={(next) => !next && closeTask()}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md"
          onEscapeKeyDown={(event) => {
            const target = event.target as Element | null;
            if (target instanceof HTMLElement && target.closest('input, textarea, select') !== null) {
              event.preventDefault();
            }
          }}
        >
          <SheetTitle className="sr-only">Görev Detayı</SheetTitle>
          {taskId !== null && (
            <TaskInspector key={taskId} taskId={taskId} variant="sheet" />
          )}
        </SheetContent>
      </Sheet>
    </TaskInspectorContext.Provider>
  );
}