export type ChecklistItem = {
  readonly id: string;
  readonly userId: string;
  readonly taskId: string;
  readonly text: string;
  readonly position: number;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
