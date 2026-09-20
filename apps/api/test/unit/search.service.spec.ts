import { describe, expect, it, jest } from '@jest/globals';

import { SearchService } from '../../src/modules/planning/application/search.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('search service — searchTasks', () => {
  it('passes filters to repository', async () => {
    const repository = repositoryMock();
    repository.searchTasks.mockResolvedValue({ tasks: [] });

    const service = new SearchService(repository);
    const result = await service.searchTasks({
      userId: 'user-id',
      q: 'grocery',
      limit: 20,
      sort: 'relevance',
      order: 'desc',
      areaId: 'area-id',
      priority: 'HIGH',
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      data: [],
      hasMore: false,
    });
    expect(repository.searchTasks).toHaveBeenCalledWith('user-id', 'grocery', {
      limit: 20,
      sort: 'relevance',
      order: 'desc',
      areaId: 'area-id',
      priority: 'HIGH',
    });
  });

  it('passes dateState bounds to repository', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-20T12:00:00.000Z'));
    const repository = repositoryMock();
    repository.searchTasks.mockResolvedValue({ tasks: [] });

    const service = new SearchService(repository);
    await service.searchTasks({
      userId: 'user-id',
      q: 'taxes',
      limit: 10,
      sort: 'dueDate',
      order: 'asc',
      dateState: 'overdue',
      timezone: 'UTC',
    });

    jest.useRealTimers();
    expect(repository.searchTasks).toHaveBeenCalledWith('user-id', 'taxes', {
      limit: 10,
      sort: 'dueDate',
      order: 'asc',
      dateState: 'overdue',
      todayStart: new Date('2026-09-20T00:00:00.000Z'),
      todayEnd: new Date('2026-09-21T00:00:00.000Z'),
    });
  });
});

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    searchTasks: jest.fn(),
    findParentForSubtask: jest.fn(),
    getSubtaskStats: jest.fn(),
  } as unknown as jest.Mocked<TaskRepository>;
}
