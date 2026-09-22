import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { RecurrenceService } from '../../src/modules/planning/application/recurrence.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service — getWeeklyStatistics', () => {
  it('returns seven day buckets with zero counts when nothing completed', async () => {
    const repository = repositoryMock();
    repository.findCompletedTasksBetween.mockResolvedValue([]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.getWeeklyStatistics('user-id', 'Europe/Istanbul');

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.days).toHaveLength(7);
      expect(result.totalCompleted).toBe(0);
      expect(result.days.every((day) => day.count === 0)).toBe(true);
    }
  });

  it('buckets completed tasks into their local day', async () => {
    const repository = repositoryMock();
    const now = new Date();
    repository.findCompletedTasksBetween.mockResolvedValue([
      { id: 'task-1', updatedAt: now },
      { id: 'task-2', updatedAt: new Date(now.getTime() - 86_400_000) },
    ]);

    const service = new TaskService(repository, recurrenceServiceMock());
    const result = await service.getWeeklyStatistics('user-id', 'Europe/Istanbul');

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.totalCompleted).toBe(2);
      expect(result.days).toHaveLength(7);
      const todayIdx = result.days.length - 1;
      const yesterdayIdx = result.days.length - 2;
      expect(result.days[todayIdx]?.count).toBe(1);
      expect(result.days[yesterdayIdx]?.count).toBe(1);
    }
  });

  it('passes the trailing seven days as the query range', async () => {
    const repository = repositoryMock();
    repository.findCompletedTasksBetween.mockResolvedValue([]);

    const service = new TaskService(repository, recurrenceServiceMock());
    await service.getWeeklyStatistics('user-id', 'America/New_York');

    expect(repository.findCompletedTasksBetween).toHaveBeenCalledWith(
      'user-id',
      expect.any(Date),
      expect.any(Date),
    );
  });
});

function repositoryMock(): jest.Mocked<TaskRepository> {
  return {
    findCompletedTasksBetween: jest.fn(),
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