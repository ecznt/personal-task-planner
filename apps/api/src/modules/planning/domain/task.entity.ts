import type { ChecklistItem } from './checklist-item.entity';
import type { LabelSummary } from './label.entity';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecurrenceSeriesState = 'ACTIVE' | 'PAUSED' | 'STOPPED';
export type RecurrenceMode = 'CALENDAR_BASED' | 'COMPLETION_BASED';
export type RecurrenceFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceRuleState = 'ACTIVE' | 'SUPERSEDED' | 'STOPPED';

export type RecurrenceRule = {
  readonly id: string;
  readonly userId: string;
  readonly seriesId: string;
  readonly versionNumber: number;
  readonly mode: RecurrenceMode;
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly selectedWeekdays: readonly number[];
  readonly dayOfMonth: number | null;
  readonly monthOfYear: number | null;
  readonly localTime: string | null;
  readonly state: RecurrenceRuleState;
  readonly createdAt: Date;
};

export type RecurrenceSeries = {
  readonly id: string;
  readonly userId: string;
  readonly state: RecurrenceSeriesState;
  readonly currentOpenTaskId: string | null;
  readonly lastCompletedTaskId: string | null;
  readonly nextOccurrenceNumber: number;
  readonly activeRuleVersionId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RecurrenceSeriesDetail = {
  readonly series: RecurrenceSeries;
  readonly activeRule: RecurrenceRule;
  readonly currentOpenTaskId: string | null;
};

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
  readonly recurrenceSeriesId: string | null;
  readonly recurrenceRuleVersionId: string | null;
  readonly occurrenceNumber: number | null;
  readonly predecessorTaskId: string | null;
  readonly generationKey: string | null;
};

export type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly dueAt: Date | null;
  readonly plannedAt: Date | null;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly version: number;
  readonly areaId: string;
};

export type TaskDetail = {
  readonly task: Task;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly areaName: string;
  readonly labels: readonly LabelSummary[];
  readonly checklistItems: readonly ChecklistItem[];
  readonly recurrence: RecurrenceSeriesDetail | null;
};
