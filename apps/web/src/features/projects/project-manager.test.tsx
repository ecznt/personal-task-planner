import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ProjectManager } from './project-manager';

function renderProjectManager(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectManager areaId="123e4567-e89b-12d3-a456-426614174000" />
    </QueryClientProvider>,
  );
}

describe('ProjectManager', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderProjectManager();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
