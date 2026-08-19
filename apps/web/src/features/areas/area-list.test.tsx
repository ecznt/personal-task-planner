import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { AreaList } from './area-list';

function renderAreaList(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AreaList />
    </QueryClientProvider>,
  );
}

describe('AreaList', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderAreaList();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
