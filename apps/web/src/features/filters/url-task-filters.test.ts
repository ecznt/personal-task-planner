import { describe, expect, it } from 'vitest';

import {
  buildFilterQueryString,
  parseTaskFiltersFromUrl,
} from './url-task-filters';

describe('url-task-filters', () => {
  it('maps canonicalStatus to status and labelId to label', () => {
    const filters = parseTaskFiltersFromUrl(
      new URLSearchParams('status=IN_PROGRESS&label=label-1&areaId=area-1&priority=LOW'),
    );

    expect(filters).toEqual({
      areaId: 'area-1',
      canonicalStatus: 'IN_PROGRESS',
      labelId: 'label-1',
      priority: 'LOW',
    });
  });

  it('maps internal keys back to canonical URL names', () => {
    expect(
      buildFilterQueryString({
        areaId: 'area-1',
        canonicalStatus: 'TO_DO',
        labelId: 'label-1',
        dateState: 'overdue',
      }),
    ).toBe('areaId=area-1&status=TO_DO&label=label-1&dateState=overdue');
  });

  it('drops unknown and invalid values', () => {
    const filters = parseTaskFiltersFromUrl(
      new URLSearchParams('status=INVALID&dateState=bogus&projectId=project-1&areaId='),
    );

    expect(filters).toEqual({ projectId: 'project-1' });
  });

  it('returns empty for empty params', () => {
    expect(parseTaskFiltersFromUrl(new URLSearchParams(''))).toEqual({});
    expect(buildFilterQueryString({})).toBe('');
  });
});