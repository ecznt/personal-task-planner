export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  readonly id: string;
  readonly userId: string;
  readonly areaId: string;
  readonly projectId: string | null;
  readonly areaStatusId: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: Date | null;
  readonly dueAt: Date | null;
  readonly priority: TaskPriority;
  readonly completedAt: Date | null;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly globalRank: string;
  readonly areaRank: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly dueAt: Date | null;
  readonly plannedAt: Date | null;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
};

export type TaskDetail = {
  readonly task: Task;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly areaName: string;
};
