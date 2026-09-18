import type { LabelSummary } from '../domain/label.entity';

export type SerializedLabel = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly version: number;
};

export function serializeTaskLabels(labels: readonly LabelSummary[]): SerializedLabel[] {
  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    version: label.version,
  }));
}
