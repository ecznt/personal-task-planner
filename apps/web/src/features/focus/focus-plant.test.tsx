import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FocusPlant } from './focus-plant';

function renderPlant(tier: 'flower' | 'plant' | 'tree', progress: number, animated = true) {
  const { container } = render(<FocusPlant tier={tier} progress={progress} animated={animated} />);
  const svg = container.querySelector('svg');
  if (svg === null) {
    throw new Error('FocusPlant did not render an svg element.');
  }
  return svg;
}

describe('FocusPlant', () => {
  it('renders tier and stage data attributes', () => {
    const svg = renderPlant('flower', 0.5);
    expect(svg).toHaveAttribute('data-tier', 'flower');
    expect(svg).toHaveAttribute('data-stage', '1');
  });

  it('holds completed stage at full progress', () => {
    expect(renderPlant('tree', 1)).toHaveAttribute('data-stage', '3');
  });

  it('holds early stage at zero progress', () => {
    expect(renderPlant('plant', 0)).toHaveAttribute('data-stage', '0');
  });

  it('does not sway when animated is disabled', () => {
    const svg = renderPlant('flower', 0, false);
    expect(svg.querySelector('.focus-plant-sway')).toBeNull();
  });

  it('sways while animated', () => {
    const svg = renderPlant('flower', 0.5, true);
    expect(svg.querySelector('.focus-plant-sway')).not.toBeNull();
  });
});