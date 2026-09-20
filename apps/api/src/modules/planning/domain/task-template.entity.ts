export type TaskTemplate = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays: number | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TaskTemplateSummary = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly checklistSteps: readonly string[];
  readonly labelNames: readonly string[];
  readonly defaultPlannedAtOffsetDays: number | null;
  readonly version: number;
  readonly updatedAt: Date;
};