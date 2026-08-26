import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — listKanbanTasks', () => {
  it('returns tasks grouped by canonical status', async () => {
    const repository = repositoryMock();
    repository.findKanbanTasks.mockResolvedValue({
      todo: [
        {
          id: 'task-1',
          title: 'Todo Task',
          priority: 'HIGH',
          canonicalStatus: 'TO_DO',
          dueAt: null,
          plannedAt: null,
          lifecycleState: 'ACTIVE',
          version: 1,
          areaId: 'area-id',
        },
      ],
      inProgress: [],
      completed: [],
    });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listKanbanTasks('user-id');

    expect(result).toEqual({
      outcome: 'SUCCESS',
      todo: expect.arrayContaining([expect.objectContaining({ id: 'task-1' })]),
      inProgress: [],
      completed: [],
    });
  });
});

describe('task service — moveKanbanTask', () => {
  it('moves task to new canonical group', async () => {
    const repository = repositoryMock();
    repository.moveTask.mockResolvedValue({
      task: {
        id: 'task-1',
        areaId: 'area-1',
        userId: 'user-id',
        title: 'Moved Task',
        description: null,
        plannedAt: null,
        dueAt: null,
        priority: 'MEDIUM',
        areaStatusId: 'status-2',
        globalRank: '000000000000000000000001',
        areaRank: '000000000000000000000001',
        lifecycleState: 'ACTIVE',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: null,
        completedAt: null,
        recurrenceSeriesId: null,
        recurrenceRuleVersionId: null,
        occurrenceNumber: null,
        predecessorTaskId: null,
        generationKey: null,
      },
      defaultStatusId: 'status-2',
    });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveKanbanTask('user-id', {
      taskId: 'task-1',
      targetCanonicalStatus: 'IN_PROGRESS',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.etag).toBe(2);
    }
  });

  it('returns NOT_FOUND when task does not exist', async () => {
    const repository = repositoryMock();
    repository.moveTask.mockResolvedValue({ task: null, defaultStatusId: null });
    repository.findById.mockResolvedValue(null);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveKanbanTask('user-id', {
      taskId: 'nonexistent',
      targetCanonicalStatus: 'IN_PROGRESS',
      version: 1,
    });

    expect(result.outcome).toBe('NOT_FOUND');
  });

  it('returns STALE_VERSION on version mismatch', async () => {
    const repository = repositoryMock();
    repository.moveTask.mockResolvedValue({ task: null, defaultStatusId: null });
    repository.findById.mockResolvedValue({
      task: { id: 'task-1' },
      canonicalStatus: 'TO_DO',
      areaName: 'Area',
      labels: [],
      checklistItems: [],
    } as never);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveKanbanTask('user-id', {
      taskId: 'task-1',
      targetCanonicalStatus: 'IN_PROGRESS',
      version: 1,
    });

    expect(result.outcome).toBe('STALE_VERSION');
  });
});

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    createTask: jest.fn(),
    findDefaultToDoStatus: jest.fn(),
    findById: jest.fn(),
    listByArea: jest.fn(),
    listGlobal: jest.fn(),
    findTodayTasks: jest.fn(),
    findKanbanTasks: jest.fn(),
    findAreaKanbanTasks: jest.fn(),
    moveTask: jest.fn(),
    moveAreaKanbanTask: jest.fn(),
    updateTask: jest.fn(),
    areaExists: jest.fn(),
    areaStatusBelongsToArea: jest.fn(),
    projectBelongsToArea: jest.fn(),
    incrementVersion: jest.fn(),
    setTaskLabels: jest.fn(),
  } as unknown as jest.Mocked<TaskRepository>;
}

function recurrenceServiceMock(): any {
  return {
    setRecurrence: jest.fn(),
    stopRecurrence: jest.fn(),
    getRecurrence: jest.fn(),
    generateNextOccurrence: jest.fn(),
  };
}
