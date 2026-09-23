import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { RecurrenceService } from '../../src/modules/planning/application/recurrence.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — listProjectKanbanTasks', () => {
  it('returns project statuses and columns grouped by status', async () => {
    const repository = repositoryMock();
    repository.projectExists.mockResolvedValue(true);
    repository.findProjectKanbanTasks.mockResolvedValue({
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
              durationMinutes: null,
              lifecycleState: 'ACTIVE',
              version: 1,
              areaId: 'area-1',
              parentTaskId: null,
              subtaskCount: 0,
              completedSubtaskCount: 0,
              blockedByTaskIds: [],
              labels: [],
              project: { id: 'project-1', name: 'Proje' },
              parentTask: null,
              blockedByTasks: [],
              isBlocked: false,
              areaName: 'Test Alan',
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
    const result = await service.listProjectKanbanTasks('user-id', 'project-1');

    expect(result).toEqual({
      outcome: 'SUCCESS',
      statuses: expect.arrayContaining([expect.objectContaining({ id: 'status-1' })]),
      columns: expect.arrayContaining([
        expect.objectContaining({ statusId: 'status-1', count: 1 }),
      ]),
    });
  });

  it('returns NOT_FOUND when project does not exist', async () => {
    const repository = repositoryMock();
    repository.projectExists.mockResolvedValue(false);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listProjectKanbanTasks('user-id', 'nonexistent');

    expect(result.outcome).toBe('NOT_FOUND');
  });

  it('passes filters through to the repository', async () => {
    const repository = repositoryMock();
    repository.projectExists.mockResolvedValue(true);
    repository.findProjectKanbanTasks.mockResolvedValue({ statuses: [], columns: [] });

    const service = new TaskService(repository, recurrenceServiceMock());
    await service.listProjectKanbanTasks('user-id', 'project-1', {
      q: 'rapor',
      priority: 'MEDIUM',
      labelId: 'label-1',
    });

    expect(repository.findProjectKanbanTasks).toHaveBeenCalledWith('user-id', 'project-1', {
      q: 'rapor',
      priority: 'MEDIUM',
      labelId: 'label-1',
    });
  });
});

describe('task service — moveProjectKanbanTask', () => {
  it('moves task to new area status', async () => {
    const repository = repositoryMock();
    repository.moveProjectKanbanTask.mockResolvedValue({
      outcome: 'MOVED',
      task: {
        id: 'task-1',
        areaId: 'area-1',
        userId: 'user-id',
        title: 'Moved Task',
        description: null,
        plannedAt: null,
        dueAt: null,
        durationMinutes: null,
        priority: 'MEDIUM',
        areaStatusId: 'status-2',
        globalRank: '000000000000000000000001',
        areaRank: '000000000000000000000001',
        lifecycleState: 'ACTIVE',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: 'project-1',
        completedAt: null,
        recurrenceSeriesId: null,
        recurrenceRuleVersionId: null,
        occurrenceNumber: null,
        predecessorTaskId: null,
        parentTaskId: null,
        blockedByTaskIds: [],
        generationKey: null,
      },
    });
    repository.getCanonicalStatus.mockResolvedValue('IN_PROGRESS');
    repository.getSubtaskStats.mockResolvedValue({ subtaskCount: 0, completedSubtaskCount: 0 });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveProjectKanbanTask('user-id', {
      projectId: 'project-1',
      taskId: 'task-1',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.etag).toBe(2);
      expect(result.canonicalStatus).toBe('IN_PROGRESS');
    }
  });

  it('returns NOT_FOUND when project or task does not exist', async () => {
    const repository = repositoryMock();
    repository.moveProjectKanbanTask.mockResolvedValue({ outcome: 'NOT_FOUND' });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveProjectKanbanTask('user-id', {
      projectId: 'project-1',
      taskId: 'nonexistent',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('NOT_FOUND');
  });

  it('returns STALE_VERSION on version mismatch', async () => {
    const repository = repositoryMock();
    repository.moveProjectKanbanTask.mockResolvedValue({ outcome: 'STALE_VERSION' });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveProjectKanbanTask('user-id', {
      projectId: 'project-1',
      taskId: 'task-1',
      targetAreaStatusId: 'status-2',
      version: 1,
    });

    expect(result.outcome).toBe('STALE_VERSION');
  });

  it('returns INVALID_TARGET when target status is not in the project area', async () => {
    const repository = repositoryMock();
    repository.moveProjectKanbanTask.mockResolvedValue({ outcome: 'INVALID_TARGET' });

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.moveProjectKanbanTask('user-id', {
      projectId: 'project-1',
      taskId: 'task-1',
      targetAreaStatusId: 'foreign-status',
      version: 1,
    });

    expect(result.outcome).toBe('INVALID_TARGET');
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
    findProjectKanbanTasks: jest.fn(),
    projectExists: jest.fn(),
    moveTask: jest.fn(),
    moveAreaKanbanTask: jest.fn(),
    moveProjectKanbanTask: jest.fn(),
    updateTask: jest.fn(),
    findParentForSubtask: jest.fn(),
    getSubtaskStats: jest.fn(async () => ({ subtaskCount: 0, completedSubtaskCount: 0 })),
    loadBlockedBy: jest.fn(async () => new Map()),
    areaExists: jest.fn(),
    areaStatusBelongsToArea: jest.fn(),
    projectBelongsToArea: jest.fn(),
    incrementVersion: jest.fn(),
    setTaskLabels: jest.fn(),
    getCanonicalStatus: jest.fn(),
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
