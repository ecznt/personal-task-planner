import { ListTree } from 'lucide-react';

type SubtaskProgressProps = {
  readonly parentTaskId: string | null;
  readonly subtaskCount: number;
  readonly completedSubtaskCount: number;
};

export function SubtaskProgress({
  parentTaskId,
  subtaskCount,
  completedSubtaskCount,
}: SubtaskProgressProps) {
  if (parentTaskId !== null || subtaskCount <= 0) return null;

  return (
    <span
      title={`${completedSubtaskCount}/${subtaskCount} alt görev tamamlandı`}
      className="inline-flex items-center gap-1"
    >
      <ListTree className="size-3.5" aria-hidden="true" />
      {completedSubtaskCount}/{subtaskCount}
    </span>
  );
}
