export type Project = {
  readonly id: string;
  readonly userId: string;
  readonly areaId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProjectSummary = {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly lifecycleState: string;
  readonly version: number;
  readonly taskCount: number;
  readonly completedTaskCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProjectDetail = ProjectSummary;
