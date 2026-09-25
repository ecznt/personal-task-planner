export type FocusSession = {
  readonly id: string;
  readonly userId: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly durationMinutes: number;
  readonly clientKey: string;
  readonly createdAt: Date;
};