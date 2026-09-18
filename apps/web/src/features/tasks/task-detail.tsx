'use client';

import { TaskInspector } from './task-inspector';

type TaskDetailProps = {
  readonly taskId: string;
};

export function TaskDetail({ taskId }: TaskDetailProps) {
  return <TaskInspector taskId={taskId} variant="page" />;
}