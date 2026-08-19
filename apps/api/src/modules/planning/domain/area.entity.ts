export type Area = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type AreaStatus = {
  readonly id: string;
  readonly userId: string;
  readonly areaId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly position: number;
  readonly isDefault: boolean;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type AreaSummary = {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly taskCount: number;
  readonly projectCount: number;
  readonly overdueTaskCount: number;
};

export type AreaDetail = {
  readonly area: Area;
  readonly statuses: readonly AreaStatus[];
  readonly taskCount: number;
  readonly projectCount: number;
};
