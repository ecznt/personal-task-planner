import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — listTodayTasks', () => {
  it('returns empty sections when no tasks match today', async () => {
    const repository = repositoryMock();
    repository.findTodayTasks.mockResolvedValue([]);

    const service = new TaskService(repository);
    const result = await service.listTodayTasks('user-id', {
      timezone: 'Europe/Istanbul',
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      today: expect.any(String),
      timezone: 'Europe/Istanbul',
      overdue: [],
      plannedToday: [],
      dueToday: [],
      completedToday: [],
    });
  });

  it('buckets overdue tasks correctly', async () => {
    const repository = repositoryMock();
    repository.findTodayTasks.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Overdue Task',
        priority: 'HIGH',
        canonicalStatus: 'TO_DO',
        dueAt: new Date('2020-01-01'),
        plannedAt: null,
        lifecycleState: 'ACTIVE',
        version: 1,
        areaId: 'area-id',
        reasons: ['overdue'],
      },
    ]);

    const service = new TaskService(repository);
    const result = await service.listTodayTasks('user-id', {
      timezone: 'Europe/Istanbul',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.overdue).toHaveLength(1);
      expect(result.overdue[0]?.title).toBe('Overdue Task');
      expect(result.plannedToday).toHaveLength(0);
    }
  });

  it('deduplicates plannedToday from dueToday', async () => {
    const repository = repositoryMock();
    repository.findTodayTasks.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Both planned and due',
        priority: 'MEDIUM',
        canonicalStatus: 'TO_DO',
        dueAt: new Date(),
        plannedAt: new Date(),
        lifecycleState: 'ACTIVE',
        version: 1,
        areaId: 'area-id',
        reasons: ['plannedToday', 'dueToday'],
      },
    ]);

    const service = new TaskService(repository);
    const result = await service.listTodayTasks('user-id', {
      timezone: 'Europe/Istanbul',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.plannedToday).toHaveLength(1);
      expect(result.dueToday).toHaveLength(0);
    }
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
