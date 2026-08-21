import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — listGlobalTasks', () => {
  it('returns active tasks with default sort', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({
      tasks: [
        {
          id: 'task-1',
          title: 'Test Task',
          priority: 'MEDIUM',
          canonicalStatus: 'TO_DO',
          dueAt: null,
          plannedAt: null,
          lifecycleState: 'ACTIVE',
        },
      ],
    });

    const service = new TaskService(repository);
    const result = await service.listGlobalTasks('user-id', {});

    expect(result).toEqual({
      outcome: 'SUCCESS',
      tasks: expect.arrayContaining([expect.objectContaining({ id: 'task-1' })]),
    });
  });

  it('passes filters to repository', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({ tasks: [] });

    const service = new TaskService(repository);
    await service.listGlobalTasks('user-id', {
      sort: 'dueDate',
      order: 'desc',
      areaId: 'area-id',
      priority: 'HIGH',
      canonicalStatus: 'IN_PROGRESS',
    });

    expect(repository.listGlobal).toHaveBeenCalledWith('user-id', {
      limit: 20,
      sort: 'dueDate',
      order: 'desc',
      areaId: 'area-id',
      priority: 'HIGH',
      canonicalStatus: 'IN_PROGRESS',
    });
  });

  it('returns nextCursor when available', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({
      tasks: [],
      nextCursor: 'cursor-123',
    });

    const service = new TaskService(repository);
    const result = await service.listGlobalTasks('user-id', {});

    expect(result).toEqual({
      outcome: 'SUCCESS',
      tasks: [],
      nextCursor: 'cursor-123',
    });
  });
});

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    createTask: jest.fn(),
    findDefaultToDoStatus: jest.fn(),
    findById: jest.fn(),
    listByArea: jest.fn(),
    listGlobal: jest.fn(),
    updateTask: jest.fn(),
    areaExists: jest.fn(),
    areaStatusBelongsToArea: jest.fn(),
    projectBelongsToArea: jest.fn(),
    incrementVersion: jest.fn(),
    setTaskLabels: jest.fn(),
  } as unknown as jest.Mocked<TaskRepository>;
}
