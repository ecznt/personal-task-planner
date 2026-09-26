import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { RecurrenceService } from '../../src/modules/planning/application/recurrence.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';
import type { TaskSummary } from '../../src/modules/planning/domain/task.entity';

describe('task service — listCalendarTasks', () => {
  it('returns empty days when the repository has no matching tasks', async () => {
    const repository = repositoryMock();
    repository.findUpcomingTasks.mockResolvedValue([]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-14',
      end: '2026-09-14',
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      timezone: 'Europe/Istanbul',
      days: [{ date: '2026-09-14', planned: [], due: [] }],
    });
  });

  it('places a Task on both its planned day and its due day', async () => {
    const repository = repositoryMock();
    const task = makeSummary('task-both-ways', {
      plannedAt: new Date('2026-09-14T09:00:00.000Z'),
      dueAt: new Date('2026-09-15T18:00:00.000Z'),
    });
    repository.findUpcomingTasks.mockResolvedValue([task]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-14',
      end: '2026-09-16',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;

    expect(result.days).toEqual([
      { date: '2026-09-14', planned: [task], due: [] },
      { date: '2026-09-15', planned: [], due: [task] },
      { date: '2026-09-16', planned: [], due: [] },
    ]);
  });

  it('does not duplicate a Task whose planned and due fall on the same local day', async () => {
    const repository = repositoryMock();
    const task = makeSummary('task-same-day', {
      plannedAt: new Date('2026-09-14T09:00:00.000Z'),
      dueAt: new Date('2026-09-14T12:00:00.000Z'),
    });
    repository.findUpcomingTasks.mockResolvedValue([task]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-14',
      end: '2026-09-14',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;
    expect(result.days).toEqual([{ date: '2026-09-14', planned: [task], due: [] }]);
  });

  it('buckets by the local timezone day across UTC midnight', async () => {
    const repository = repositoryMock();
    const task = makeSummary('task-eve', {
      plannedAt: new Date('2026-09-13T22:30:00.000Z'),
      dueAt: null,
    });
    repository.findUpcomingTasks.mockResolvedValue([task]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-13',
      end: '2026-09-14',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;
    expect(result.days[0]).toEqual({ date: '2026-09-13', planned: [], due: [] });
    expect(result.days[1]).toEqual({ date: '2026-09-14', planned: [task], due: [] });
  });

  it('ignores Tasks whose dates fall outside the requested range', async () => {
    const repository = repositoryMock();
    const before = makeSummary('task-before', {
      plannedAt: new Date('2026-09-10T09:00:00.000Z'),
      dueAt: null,
    });
    const after = makeSummary('task-after', {
      plannedAt: null,
      dueAt: new Date('2026-09-20T09:00:00.000Z'),
    });
    repository.findUpcomingTasks.mockResolvedValue([before, after]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-14',
      end: '2026-09-16',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;
    expect(result.days.every((day) => day.planned.length === 0 && day.due.length === 0)).toBe(true);
  });

  it('passes the local-midnight UTC range to the repository', async () => {
    const repository = repositoryMock();
    repository.findUpcomingTasks.mockResolvedValue([]);

    const service = new TaskService(repository, recurrenceServiceMock());
    await service.listCalendarTasks('user-id', {
      timezone: 'Europe/Istanbul',
      start: '2026-09-14',
      end: '2026-09-16',
    });

    expect(repository.findUpcomingTasks).toHaveBeenCalledWith(
      'user-id',
      new Date('2026-09-13T21:00:00.000Z'),
      new Date('2026-09-16T21:00:00.000Z'),
    );
  });

  it('projects future recurring occurrences from the latest series anchor', async () => {
    const repository = repositoryMock();
    const anchor = makeSummary('anchor-1', {
      plannedAt: new Date('2026-09-11T09:00:00.000Z'),
      dueAt: null,
    });
    repository.findUpcomingTasks.mockResolvedValue([]);
    repository.findRecurrenceAnchors.mockResolvedValue([
      {
        task: anchor,
        seriesId: 'series-1',
        mode: 'CALENDAR_BASED',
        frequency: 'DAILY',
        interval: 1,
        selectedWeekdays: [],
        dayOfMonth: null,
        monthOfYear: null,
        localTime: null,
        nextOccurrenceNumber: 2,
      },
    ]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.listCalendarTasks('user-id', {
      timezone: 'UTC',
      start: '2026-09-12',
      end: '2026-09-14',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;

    expect(
      result.days.map((day) => ({
        date: day.date,
        planned: day.planned.map((task) => task.id),
        due: day.due.map((task) => task.id),
      })),
    ).toEqual([
      { date: '2026-09-12', planned: ['anchor-1'], due: [] },
      { date: '2026-09-13', planned: ['anchor-1'], due: [] },
      { date: '2026-09-14', planned: ['anchor-1'], due: [] },
    ]);

    expect(result.days[0]?.planned[0]?.recurrenceProjection).toMatchObject({
      seriesId: 'series-1',
      mode: 'CALENDAR_BASED',
      frequency: 'DAILY',
      interval: 1,
      occurrenceNumber: 2,
    });
  });
});

function makeSummary(
  id: string,
  overrides: Partial<Pick<TaskSummary, 'plannedAt' | 'dueAt'>>,
): TaskSummary {
  return {
    id,
    title: `Task ${id}`,
    priority: 'MEDIUM',
    canonicalStatus: 'TO_DO',
    dueAt: null,
    plannedAt: null,
    durationMinutes: null,
    lifecycleState: 'ACTIVE',
    version: 1,
    areaId: 'inbox-id',
    parentTaskId: null,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    blockedByTaskIds: [],
    labels: [],
    ...overrides,
  };
}

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    createTask: jest.fn(),
    findDefaultToDoStatus: jest.fn(),
    findById: jest.fn(),
    listByArea: jest.fn(),
    updateTask: jest.fn(),
    findParentForSubtask: jest.fn(),
    getSubtaskStats: jest.fn(),
    areaExists: jest.fn(),
    areaStatusBelongsToArea: jest.fn(),
    incrementVersion: jest.fn(),
    setTaskLabels: jest.fn(),
    findAreaKanbanTasks: jest.fn(),
    moveAreaKanbanTask: jest.fn(),
    getCanonicalStatus: jest.fn(),
    findUpcomingTasks: jest.fn(),
    projectBelongsToArea: jest.fn(),
    labelsBelongToUser: jest.fn(),
    listGlobal: jest.fn(),
    findTodayTasks: jest.fn(),
    findKanbanTasks: jest.fn(),
    moveTask: jest.fn(),
    searchTasks: jest.fn(),
    bulkStatusChange: jest.fn(),
    bulkLabelChange: jest.fn(),
    findRecurrenceAnchors: jest.fn(async () => []),
  } as unknown as jest.Mocked<TaskRepository>;
}

function recurrenceServiceMock(): jest.Mocked<RecurrenceService> {
  return {
    setRecurrence: jest.fn(),
    stopRecurrence: jest.fn(),
    getRecurrence: jest.fn(),
    generateNextOccurrence: jest.fn(),
  } as unknown as jest.Mocked<RecurrenceService>;
}
