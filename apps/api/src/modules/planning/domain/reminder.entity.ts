export type ReminderAnchorType = 'PLANNED' | 'DUE';
export type ReminderRuleType = 'OFFSET' | 'AT_TIME';
export type ReminderState = 'SCHEDULED' | 'TRIGGERED' | 'SUPPRESSED' | 'PAUSED' | 'CANCELLED';
export type NotificationReadState = 'UNREAD' | 'READ';

export type TaskReminder = {
  readonly id: string;
  readonly userId: string;
  readonly taskId: string;
  readonly anchorType: ReminderAnchorType;
  readonly ruleType: ReminderRuleType;
  readonly offsetMinutes: number | null;
  readonly atTime: Date | null;
  readonly scheduledAt: Date;
  readonly state: ReminderState;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type Notification = {
  readonly id: string;
  readonly userId: string;
  readonly taskReminderId: string;
  readonly title: string;
  readonly body: string | null;
  readonly readState: NotificationReadState;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type NotificationDetail = Notification & {
  readonly taskTitle: string | null;
  readonly taskDueAt: Date | null;
};
