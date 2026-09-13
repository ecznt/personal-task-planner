import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { RecurrenceService } from '../../src/modules/planning/application/recurrence.service';
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
          version: 1,
          areaId: 'area-id',
        },
      ],
    });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listGlobalTasks('user-id', {});

    expect(result).toEqual({
      outcome: 'SUCCESS',
      tasks: expect.arrayContaining([expect.objectContaining({ id: 'task-1' })]),
    });
  });

  it('passes filters to repository', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({ tasks: [] });

    const service = new TaskService(repository, recurrenceServiceMock());
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

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listGlobalTasks('user-id', {});

    expect(result).toEqual({
      outcome: 'SUCCESS',
      tasks: [],
      nextCursor: 'cursor-123',
    });
  });

  it('passes dateState bounds to repository', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({ tasks: [] });

    const service = new TaskService(repository, recurrenceServiceMock());
    await service.listGlobalTasks('user-id', {
      dateState: 'dueToday',
      timezone: 'UTC',
    });

    expect(repository.listGlobal).toHaveBeenCalledWith('user-id', {
      limit: 20,
      sort: 'plannedDate',
      order: 'asc',
      dateState: 'dueToday',
      todayStart: new Date('2026-09-13T00:00:00.000Z'),
      todayEnd: new Date('2026-09-14T00:00:00.000Z'),
    });
  });

  it('does not pass date bounds when dateState is absent', async () => {
    const repository = repositoryMock();
    repository.listGlobal.mockResolvedValue({ tasks: [] });

    const service = new TaskService(repository, recurrenceServiceMock());
    await service.listGlobalTasks('user-id', { timezone: 'UTC' });

    expect(repository.listGlobal).toHaveBeenCalledWith('user-id', {
      limit: 20,
      sort: 'plannedDate',
      order: 'asc',
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
    findAreaKanbanTasks: jest.fn(),
    moveAreaKanbanTask: jest.fn(),
  } as unknown as jest.Mocked<TaskRepository>;
}

function recurrenceServiceMock() {
  return {
    setRecurrence: jest.fn(),
    stopRecurrence: jest.fn(),
    getRecurrence: jest.fn(),
    generateNextOccurrence: jest.fn(),
  } as unknown as RecurrenceService;
}
