import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LABEL_COLOR,
  anchorLabel,
  isValidLabelColor,
  labelTint,
  resolveLabelColor,
} from './label-color';

describe('label-color', () => {
  it('accepts valid hex colors and rejects everything else', () => {
    expect(isValidLabelColor('#1a2b3c')).toBe(true);
    expect(isValidLabelColor('#ABCDEF')).toBe(true);
    expect(isValidLabelColor('1a2b3c')).toBe(false);
    expect(isValidLabelColor('#123')).toBe(false);
    expect(isValidLabelColor(null)).toBe(false);
    expect(isValidLabelColor(undefined)).toBe(false);
  });

  it('resolves missing or invalid colors to the default', () => {
    expect(resolveLabelColor('#16a34a')).toBe('#16a34a');
    expect(resolveLabelColor(null)).toBe(DEFAULT_LABEL_COLOR);
    expect(resolveLabelColor('not-a-color')).toBe(DEFAULT_LABEL_COLOR);
  });

  it('builds an oklch tint from the resolved color', () => {
    expect(labelTint('#16a34a', 16)).toContain('color-mix(in oklch, #16a34a 16%');
    expect(labelTint(null, 16)).toContain(DEFAULT_LABEL_COLOR);
  });

  it('anchors on the first label', () => {
    const labels = [
      { id: 'a', name: 'A', color: '#dc2626' },
      { id: 'b', name: 'B', color: '#2563eb' },
    ];

    expect(anchorLabel(labels)?.id).toBe('a');
    expect(anchorLabel([])).toBeUndefined();
  });
});
