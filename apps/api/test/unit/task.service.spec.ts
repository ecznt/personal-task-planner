import { describe, expect, it, jest } from '@jest/globals';

import { TaskService } from '../../src/modules/planning/application/task.service';
import type { TaskRepository } from '../../src/modules/planning/infrastructure/task.repository';

describe('task service', () => {
  it('validates task title is not blank', async () => {
    const service = new TaskService(repositoryMock());

    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: '',
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Görev başlığı boş olamaz.',
    });
  });

  it('validates task title length', async () => {
    const service = new TaskService(repositoryMock());

    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: 'a'.repeat(501),
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Görev başlığı 500 karakterden uzun olamaz.',
    });
  });

  it('validates description length', async () => {
    const service = new TaskService(repositoryMock());

    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: 'Valid title',
      description: 'a'.repeat(5001),
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Görev açıklaması 5000 karakterden uzun olamaz.',
    });
  });

  it('validates dueAt must not precede plannedAt', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findDefaultToDoStatus.mockResolvedValue({ id: 'status-id' });

    const service = new TaskService(repository);

    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: 'Valid task',
      description: null,
      plannedAt: new Date('2026-08-22T09:00:00Z'),
      dueAt: new Date('2026-08-20T09:00:00Z'),
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.',
    });
  });

  it('returns NOT_FOUND when area does not exist', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(false);

    const service = new TaskService(repository);

    const result = await service.createTask('user-id', {
      areaId: 'non-existent',
      title: 'Valid task',
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns VALIDATION_ERROR when default status not found', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findDefaultToDoStatus.mockResolvedValue(null);

    const service = new TaskService(repository);

    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: 'Valid task',
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Alanda varsayılan durum bulunamadı.',
    });
  });

  it('creates task with valid input', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.findDefaultToDoStatus.mockResolvedValue({ id: 'status-id' });
    repository.createTask.mockResolvedValue({
      id: 'task-id',
      userId: 'user-id',
      areaId: 'area-id',
      projectId: null,
      areaStatusId: 'status-id',
      title: 'Test Task',
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
    });

    const service = new TaskService(repository);
    const result = await service.createTask('user-id', {
      areaId: 'area-id',
      title: 'Test Task',
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      task: expect.objectContaining({ id: 'task-id', title: 'Test Task' }),
      etag: 1,
    });
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const repository = repositoryMock();
    repository.findById.mockResolvedValue(null);

    const service = new TaskService(repository);
    const result = await service.getTask('user-id', { taskId: 'non-existent' });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns task detail for existing task', async () => {
    const repository = repositoryMock();
    repository.findById.mockResolvedValue({
      task: {
        id: 'task-id',
        userId: 'user-id',
        areaId: 'area-id',
        projectId: null,
        areaStatusId: 'status-id',
        title: 'Test Task',
        description: 'Description',
        plannedAt: null,
        dueAt: null,
        priority: 'HIGH',
        completedAt: null,
        lifecycleState: 'ACTIVE',
        globalRank: '000000000000000000000001',
        areaRank: '000000000000000000000001',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      canonicalStatus: 'TO_DO',
      areaName: 'Test Area',
      labels: [],
      checklistItems: [],
    });

    const service = new TaskService(repository);
    const result = await service.getTask('user-id', { taskId: 'task-id' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      data: expect.objectContaining({
        task: expect.objectContaining({ id: 'task-id' }),
        canonicalStatus: 'TO_DO',
        areaName: 'Test Area',
      }),
      etag: 1,
    });
  });

  it('returns NOT_FOUND when listing tasks for non-existent area', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(false);

    const service = new TaskService(repository);
    const result = await service.listTasks('user-id', { areaId: 'non-existent' });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('lists tasks for area', async () => {
    const repository = repositoryMock();
    repository.areaExists.mockResolvedValue(true);
    repository.listByArea.mockResolvedValue({
      tasks: [
        {
          id: 'task-id',
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

    const service = new TaskService(repository);
    const result = await service.listTasks('user-id', { areaId: 'area-id' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      tasks: expect.arrayContaining([expect.objectContaining({ id: 'task-id' })]),
      nextCursor: undefined,
    });
  });

  it('validates edit task title', async () => {
    const service = new TaskService(repositoryMock());

    const result = await service.editTask('user-id', {
      taskId: 'task-id',
      title: '',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Görev başlığı boş olamaz.',
    });
  });

  it('validates dueAt before plannedAt on edit', async () => {
    const repository = repositoryMock();
    repository.areaStatusBelongsToArea.mockResolvedValue(true);

    const service = new TaskService(repository);

    const result = await service.editTask('user-id', {
      taskId: 'task-id',
      plannedAt: new Date('2026-08-22T09:00:00Z'),
      dueAt: new Date('2026-08-20T09:00:00Z'),
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.',
    });
  });

  it('returns NOT_FOUND when editing non-existent task', async () => {
    const repository = repositoryMock();
    repository.updateTask.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null);

    const service = new TaskService(repository);
    const result = await service.editTask('user-id', {
      taskId: 'non-existent',
      title: 'New Title',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns STALE_VERSION when edit fails version check', async () => {
    const repository = repositoryMock();
    repository.updateTask.mockResolvedValue(null);
    repository.findById.mockResolvedValue({
      task: {
        id: 'task-id',
        userId: 'user-id',
        areaId: 'area-id',
        projectId: null,
        areaStatusId: 'status-id',
        title: 'Old Title',
        description: null,
        plannedAt: null,
        dueAt: null,
        priority: 'MEDIUM',
        completedAt: null,
        lifecycleState: 'ACTIVE',
        globalRank: '000000000000000000000001',
        areaRank: '000000000000000000000001',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      canonicalStatus: 'TO_DO',
      areaName: 'Test Area',
      labels: [],
      checklistItems: [],
    });

    const service = new TaskService(repository);
    const result = await service.editTask('user-id', {
      taskId: 'task-id',
      title: 'New Title',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'STALE_VERSION' });
  });

  it('edits task with valid input', async () => {
    const repository = repositoryMock();
    repository.updateTask.mockResolvedValue({
      id: 'task-id',
      userId: 'user-id',
      areaId: 'area-id',
      projectId: null,
      areaStatusId: 'status-id',
      title: 'New Title',
      description: null,
      plannedAt: null,
      dueAt: null,
      priority: 'HIGH',
      completedAt: null,
      lifecycleState: 'ACTIVE',
      globalRank: '000000000000000000000001',
      areaRank: '000000000000000000000001',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.getCanonicalStatus.mockResolvedValue('TO_DO');

    const service = new TaskService(repository);
    const result = await service.editTask('user-id', {
      taskId: 'task-id',
      title: 'New Title',
      priority: 'HIGH',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      task: expect.objectContaining({ id: 'task-id', title: 'New Title', version: 2 }),
      etag: 2,
      canonicalStatus: 'TO_DO',
    });
  });
});

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
  } as unknown as jest.Mocked<TaskRepository>;
}
