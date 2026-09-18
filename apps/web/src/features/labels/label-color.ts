export const DEFAULT_LABEL_COLOR = '#2563eb';

export const LABEL_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type LabelLike = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
};

export function isValidLabelColor(color: string | null | undefined): color is string {
  return typeof color === 'string' && HEX_COLOR_PATTERN.test(color);
}

export function resolveLabelColor(color: string | null | undefined): string {
  return isValidLabelColor(color) ? color : DEFAULT_LABEL_COLOR;
}

export function labelTint(color: string | null | undefined, percent: number): string {
  return `color-mix(in oklch, ${resolveLabelColor(color)} ${percent}%, transparent)`;
}

export function labelTextColor(color: string | null | undefined): string {
  return `color-mix(in oklch, ${resolveLabelColor(color)} 65%, var(--foreground))`;
}

export function anchorLabel(labels: readonly LabelLike[]): LabelLike | undefined {
  return labels[0];
}
