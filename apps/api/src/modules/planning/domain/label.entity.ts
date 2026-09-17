export type Label = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly color: string | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type LabelSummary = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly version: number;
};

export type LabelDetail = {
  readonly label: Label;
};
