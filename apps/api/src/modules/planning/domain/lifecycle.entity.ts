export type LifecycleState = 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

export type LifecycleEntityKind = 'AREA' | 'PROJECT' | 'TASK';

export type LifecycleOperationKind = 'ARCHIVE' | 'TRASH' | 'RESTORE' | 'PERMANENT_DELETE';

export type LifecycleOperationState = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface LifecycleOrigin {
  readonly id: string;
  readonly kind: LifecycleEntityKind;
  readonly name: string;
  readonly lifecycleState: LifecycleState;
  readonly areaId: string | null;
  readonly projectId: string | null;
  readonly archivedAt: string | null;
  readonly trashedAt: string | null;
  readonly purgeAfter: string | null;
  readonly version: number;
}

export interface LifecycleCascadeCounts {
  readonly tasks: number;
  readonly projects: number;
  readonly areas: number;
}

export interface LifecycleOperationSummary {
  readonly id: string;
  readonly kind: LifecycleOperationKind;
  readonly rootKind: LifecycleEntityKind;
  readonly rootId: string;
  readonly state: LifecycleOperationState;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly affected: LifecycleCascadeCounts;
  readonly version: number;
}

export interface LifecycleAddressedListEntry {
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: LifecycleState;
  readonly archivedAt: string | null;
  readonly trashedAt: string | null;
  readonly purgeAfter: string | null;
  readonly version: number;
  readonly areaId: string | null;
  readonly projectId: string | null;
  readonly dueAt: string | null;
}

export interface LifecycleManagedNode {
  readonly kind: LifecycleEntityKind;
  readonly id: string;
  readonly name: string;
  readonly lifecycleState: LifecycleState;
  readonly areaId: string | null;
  readonly projectId: string | null;
  readonly archivedAt: string | null;
  readonly trashedAt: string | null;
  readonly purgeAfter: string | null;
  readonly version: number;
}
