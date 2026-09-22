import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  celebrateTaskCompleted,
  useCelebrationTrigger,
} from '@/features/today/celebration-store';

function Probe({ onValue }: { readonly onValue: (value: number) => void }) {
  const trigger = useCelebrationTrigger();
  onValue(trigger);
  return null;
}

describe('celebration store', () => {
  it('starts at zero and increments on celebrateTaskCompleted', () => {
    const values: number[] = [];
    const { unmount } = render(<Probe onValue={(v) => values.push(v)} />);

    expect(values.at(-1)).toBe(0);

    act(() => {
      celebrateTaskCompleted();
    });
    expect(values.at(-1)).toBe(1);

    act(() => {
      celebrateTaskCompleted();
    });
    expect(values.at(-1)).toBe(2);

    unmount();
  });

  it('does not notify after the last subscriber unsubscribes', () => {
    const listener = vi.fn();
    const { unmount } = render(<Probe onValue={() => listener()} />);
    listener.mockClear();
    unmount();

    act(() => {
      celebrateTaskCompleted();
    });

    expect(listener).not.toHaveBeenCalled();
  });
});