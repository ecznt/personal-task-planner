import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.stubGlobal(
  'ResizeObserver',
  class {
    disconnect() {}

    observe() {}

    unobserve() {}
  },
);

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => null),
});

afterEach(() => {
  cleanup();
});
