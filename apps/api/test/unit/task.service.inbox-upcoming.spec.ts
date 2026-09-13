import { describe, expect, it, jest } from '@jest/globals';

import type { AreaService } from '../../src/modules/planning/application/area.service';
import { TaskService, type CreateTaskCommand } from '../../src/modules/planning/application/task.service';
import type { RecurrenceService } from '../../src/modules/planning/application/recurrence.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';
import type { TaskSummary } from '../../src/modules/planning/domain/task.entity';

describe('task service inbox resolution', () => {
  it('resolves the inbox area when areaId is omitted', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findDefaultToDoStatus.mockResolvedValue({ id: 'status-id' });
    repository.createTask.mockResolvedValue(makeTask('task-id', 'inbox-id'));

    const areaService = areaServiceMock();
    const service = new TaskService(repository, recurrenceServiceMock(), areaService);

    const result = await service.createTask('user-id', basicCommand());

    expect(areaService.ensureInbox).toHaveBeenCalledWith('user-id');
    expect(repository.areaExists).toHaveBeenCalledWith('user-id', 'inbox-id');
    expect(repository.createTask).toHaveBeenCalledWith(
      'user-id',
      'inbox-id',
      expect.objectContaining({
        title: 'Quick task',
        priority: 'MEDIUM',
        plannedAt: null,
        dueAt: null,
      }),
      'status-id',
    );
    expect(result).toEqual({
      outcome: 'SUCCESS',
      task: expect.objectContaining({ id: 'task-id', areaId: 'inbox-id' }),
      etag: 1,
    });
  });

  it('does not resolve inbox when areaId is provided', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findDefaultToDoStatus.mockResolvedValue({ id: 'status-id' });
    repository.createTask.mockResolvedValue(makeTask('task-id', 'area-id'));

    const areaService = areaServiceMock();
    const service = new TaskService(repository, recurrenceServiceMock(), areaService);

    const result = await service.createTask('user-id', basicCommand('area-id'));

    expect(areaService.ensureInbox).not.toHaveBeenCalled();
    expect(repository.areaExists).toHaveBeenCalledWith('user-id', 'area-id');
    expect(result).toEqual({
      outcome: 'SUCCESS',
      task: expect.objectContaining({ id: 'task-id' }),
      etag: 1,
    });
  });

  it('returns NOT_FOUND when resolved inbox does not exist', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(false);

    const service = new TaskService(
      repository,
      recurrenceServiceMock(),
      areaServiceMock(),
    );

    const result = await service.createTask('user-id', basicCommand());

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('throws when inbox resolution needs AreaService but it is not provided', async () => {
    const repository = repositoryMock();
    const service = new TaskService(repository, recurrenceServiceMock());

    await expect(service.createTask('user-id', basicCommand())).rejects.toThrow(
      'AreaService is not available.',
    );
  });
});

describe('task service upcoming bucketing', () => {
  it('groups tasks by planned/due day and collects overdue', async () => {
    const today = rangeDay(0);
    const tomorrow = rangeDay(1);

    const overdue: TaskSummary = makeSummary('t-overdue', {
      dueAt: new Date(Date.UTC(2020, 0, 1)),
    });
    const plannedToday: TaskSummary = makeSummary('t-planned-today', {
      plannedAt: new Date(today.start.getTime() + 60 * 60 * 1_000),
      dueAt: null,
    });
    const plannedBeforeWindow: TaskSummary = makeSummary('t-past-planned', {
      plannedAt: new Date('2020-01-01T00:00:00Z'),
      dueAt: new Date(today.start.getTime() + 2 * 60 * 60 * 1_000),
    });
    const dueToday: TaskSummary = makeSummary('t-due-today', {
      dueAt: new Date(today.start.getTime() + 3 * 60 * 60 * 1_000),
    });
    const dueTomorrow: TaskSummary = makeSummary('t-due-tomorrow', {
      dueAt: new Date(tomorrow.start.getTime() + 60 * 60 * 1_000),
    });

    const repository = repositoryMock();
    repository.findUpcomingTasks.mockResolvedValue([
      overdue,
      plannedToday,
      plannedBeforeWindow,
      dueToday,
      dueTomorrow,
    ]);

    const service = new TaskService(repository, recurrenceServiceMock(), areaServiceMock());
    const result = await service.listUpcomingTasks('user-id', {
      timezone: 'Europe/Istanbul',
      days: 3,
    });

    expect(repository.findUpcomingTasks).toHaveBeenCalledWith('user-id', today.start, rangeDay(2).end);
    expect(result).toEqual({
      outcome: 'SUCCESS',
      timezone: 'Europe/Istanbul',
      overdue: [overdue],
      days: [
        {
          date: today.date,
          planned: [plannedToday],
          due: [plannedBeforeWindow, dueToday],
        },
        {
          date: tomorrow.date,
          planned: [],
          due: [dueTomorrow],
        },
        {
          date: rangeDay(2).date,
          planned: [],
          due: [],
        },
      ],
    });
  });

  it('clamps the day window between 1 and 31', async () => {
    const repository = repositoryMock();
    repository.findUpcomingTasks.mockResolvedValue([]);

    const service = new TaskService(repository, recurrenceServiceMock(), areaServiceMock());
    const result = await service.listUpcomingTasks('user-id', { timezone: 'Europe/Istanbul', days: 40 });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome !== 'SUCCESS') return;
    expect(result.days).toHaveLength(31);
  });
});

function basicCommand(areaId?: string): CreateTaskCommand {
  return {
    ...(areaId !== undefined && { areaId }),
    title: 'Quick task',
    description: null,
    plannedAt: null,
    dueAt: null,
    priority: 'MEDIUM',
  };
}

function makeTask(id: string, areaId: string) {
  return {
    id,
    userId: 'user-id',
    areaId,
    projectId: null,
    areaStatusId: 'status-id',
    title: 'Quick task',
    description: null,
    plannedAt: null,
    dueAt: null,
    priority: 'MEDIUM',
    completedAt: null,
    lifecycleState: 'ACTIVE',
    globalRank: '000000000000000000000001',
    areaRank: '000000000000000000000001',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    recurrenceSeriesId: null,
    recurrenceRuleVersionId: null,
    occurrenceNumber: null,
    predecessorTaskId: null,
    generationKey: null,
  } as const;
}

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
    lifecycleState: 'ACTIVE',
    version: 1,
    areaId: 'inbox-id',
    ...overrides,
  };
}

function rangeDay(offsetDays: number): { date: string; start: Date; end: Date } {
  const nowStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = nowStr.split('-').map((part) => Number(part));
  const start = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + offsetDays, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + offsetDays + 1, 0, 0, 0, 0));
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start);

  return { date, start, end };
}

function recurrenceServiceMock() {
  return {
    setRecurrence: jest.fn(),
    stopRecurrence: jest.fn(),
    getRecurrence: jest.fn(),
    generateNextOccurrence: jest.fn(),
  } as unknown as RecurrenceService;
}

function areaServiceMock(): jest.Mocked<AreaService> {
  const ensureInbox = jest.fn(async () => ({ id: 'inbox-id', name: 'Gelen Kutusu' }));
  return { ensureInbox } as unknown as jest.Mocked<AreaService>;
}

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    createTask: jest.fn(),
    findDefaultToDoStatus: jest.fn(),
    findById: jest.fn(),
    listByArea: jest.fn(),
    updateTask: jest.fn(),
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
  } as unknown as jest.Mocked<TaskRepository>;
}