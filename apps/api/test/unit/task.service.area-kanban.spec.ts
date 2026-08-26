import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — listAreaKanbanTasks', () => {
  it('returns area statuses and columns grouped by status', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findAreaKanbanTasks.mockResolvedValue({
      statuses: [
        { id: 'status-1', name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
        { id: 'status-2', name: 'Devam Ediyor', canonicalStatus: 'IN_PROGRESS', position: 2 },
      ],
      columns: [
        {
          statusId: 'status-1',
          count: 1,
          tasks: [
            {
              id: 'task-1',
              title: 'Test Task',
              priority: 'HIGH',
              canonicalStatus: 'TO_DO',
              dueAt: null,
              plannedAt: null,
              lifecycleState: 'ACTIVE',
              version: 1,
              areaId: 'area-1',
            },
          ],
        },
        {
          statusId: 'status-2',
          count: 0,
          tasks: [],
        },
      ],
    });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listAreaKanbanTasks('user-id', 'area-1');

    expect(result).toEqual({
      outcome: 'SUCCESS',
      statuses: expect.arrayContaining([expect.objectContaining({ id: 'status-1' })]),
      columns: expect.arrayContaining([expect.objectContaining({ statusId: 'status-1', count: 1 })]),
    });
  });

  it('returns NOT_FOUND when area does not exist', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(false);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listAreaKanbanTasks('user-id', 'nonexistent');

    expect(result.outcome).toBe('NOT_FOUND');
  });
});

describe('task service — moveAreaKanbanTask', () => {
  it('moves task to new area status', async () => {
    const repository = repositoryMock();
    repository.moveAreaKanbanTask.mockResolvedValue({
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
      valid: true,
    });
    repository.getCanonicalStatus.mockResolvedValue('IN_PROGRESS');

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveAreaKanbanTask('user-id', {
      taskId: 'task-1',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.etag).toBe(2);
    }
  });

  it('returns NOT_FOUND when task does not exist', async () => {
    const repository = repositoryMock();
    repository.moveAreaKanbanTask.mockResolvedValue({ task: null, valid: false });
    repository.findById.mockResolvedValue(null);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveAreaKanbanTask('user-id', {
      taskId: 'nonexistent',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('NOT_FOUND');
  });

  it('returns STALE_VERSION on version mismatch', async () => {
    const repository = repositoryMock();
    repository.moveAreaKanbanTask.mockResolvedValue({ task: null, valid: false });
    repository.findById.mockResolvedValue({
      task: { id: 'task-1' },
      canonicalStatus: 'TO_DO',
      areaName: 'Area',
      labels: [],
      checklistItems: [],
    } as never);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveAreaKanbanTask('user-id', {
      taskId: 'task-1',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('STALE_VERSION');
  });

  it('returns VALIDATION_ERROR when target status is invalid', async () => {
    const repository = repositoryMock();
    repository.moveAreaKanbanTask.mockResolvedValue({ task: null, valid: true });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveAreaKanbanTask('user-id', {
      taskId: 'task-1',
      targetAreaStatusId: 'invalid-status',
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
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
    getCanonicalStatus: jest.fn(),
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
