const ANCHOR_LABELS: Record<'PLANNED' | 'DUE', string> = {
  PLANNED: 'Planlanan',
  DUE: 'Bitiş',
};

export type ReminderMessageInput = {
  readonly anchorType: 'PLANNED' | 'DUE';
  readonly taskTitle: string;
  readonly anchorInstant: Date;
};

export function buildReminderTitle(taskTitle: string): string {
  return `Hatırlatma: ${taskTitle}`;
}

export function buildReminderBody(
  input: ReminderMessageInput,
  timeZone: string,
): string {
  const instant = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(input.anchorInstant);

  return `${ANCHOR_LABELS[input.anchorType]}: ${instant}`;
}