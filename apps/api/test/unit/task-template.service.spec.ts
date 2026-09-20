import { describe, expect, it, jest } from '@jest/globals';

import { TaskTemplateService } from '../../src/modules/planning/application/task-template.service';
import type { TaskService } from '../../src/modules/planning/application/task.service';
import type { LabelRepository } from '../../src/modules/planning/infrastructure/label.repository';
import type { TaskTemplateRepository } from '../../src/modules/planning/infrastructure/task-template.repository';
import type { TaskTemplate } from '../../src/modules/planning/domain/task-template.entity';

const TEMPLATE: TaskTemplate = {
  id: 'template-1',
  userId: 'user-id',
  title: 'Haftalık Rapor',
  description: 'İlerleme raporunu hazırla',
  priority: 'HIGH',
  checklistSteps: ['Veri topla', 'Rapor yaz'],
  labelNames: ['Ev', 'Mevcut Olmayan'],
  defaultPlannedAtOffsetDays: 3,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('task template service — createTemplate', () => {
  it('creates a template from command', async () => {
    const repository = repositoryMock();
    const service = serviceMock(repository);

    const result = await service.createTemplate('user-id', {
      title: 'Haftalık Rapor',
      description: null,
      priority: 'MEDIUM',
      checklistSteps: ['Veri topla'],
      labelNames: ['Ev'],
      defaultPlannedAtOffsetDays: null,
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.template.id).toBe('template-1');
      expect(result.etag).toBe(1);
    }
    expect(repository.create).toHaveBeenCalledWith('user-id', {
      title: 'Haftalık Rapor',
      description: null,
      priority: 'MEDIUM',
      checklistSteps: ['Veri topla'],
      labelNames: ['Ev'],
      defaultPlannedAtOffsetDays: null,
    });
  });

  it('rejects an empty title', async () => {
    const service = serviceMock(repositoryMock());

    const result = await service.createTemplate('user-id', {
      title: '   ',
      description: null,
      priority: 'MEDIUM',
      checklistSteps: [],
      labelNames: [],
      defaultPlannedAtOffsetDays: null,
    });

    expect(result).toEqual({ outcome: 'VALIDATION_ERROR', detail: 'Şablon adı boş olamaz.' });
  });
});

describe('task template service — listTemplates', () => {
  it('returns templates and pagination', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.list).mockResolvedValue({
      templates: [
        {
          id: 'template-1',
          title: 'Rapor',
          priority: 'MEDIUM',
          description: null,
          checklistSteps: [],
          labelNames: [],
          defaultPlannedAtOffsetDays: null,
          version: 1,
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      nextCursor: 'template-2',
    });
    const service = serviceMock(repository);

    const result = await service.listTemplates('user-id', undefined, 20);

    expect(result).toEqual({
      outcome: 'SUCCESS',
      templates: expect.arrayContaining([expect.objectContaining({ id: 'template-1' })]),
      nextCursor: 'template-2',
    });
  });
});

describe('task template service — updateTemplate', () => {
  it('updates and bumps version', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.update).mockResolvedValue({ ...TEMPLATE, title: 'Güncel', version: 2 });
    const service = serviceMock(repository);

    const result = await service.updateTemplate('user-id', {
      templateId: 'template-1',
      version: 1,
      title: 'Güncel',
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.template.version).toBe(2);
      expect(result.template.title).toBe('Güncel');
    }
  });

  it('maps missing template to NOT_FOUND', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.update).mockResolvedValue(null);
    jest.mocked(repository.findById).mockResolvedValue(null);
    const service = serviceMock(repository);

    const result = await service.updateTemplate('user-id', {
      templateId: 'missing',
      version: 1,
      title: 'X',
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });
});

describe('task template service — deleteTemplate', () => {
  it('deletes a template', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.delete).mockResolvedValue(true);
    const service = serviceMock(repository);

    const result = await service.deleteTemplate('user-id', 'template-1', 1);

    expect(result).toEqual({ outcome: 'SUCCESS' });
  });

  it('distinguishes stale version from not found', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.delete).mockResolvedValue(false);
    jest.mocked(repository.findVersion).mockResolvedValue(3);
    const service = serviceMock(repository);

    expect(await service.deleteTemplate('user-id', 'template-1', 1)).toEqual({
      outcome: 'STALE_VERSION',
    });
  });
});

describe('task template service — applyTemplate', () => {
  it('creates a task with template fields, resolves labels by name and offset plannedAt', async () => {
    const repository = repositoryMock();
    const taskService = taskServiceMock();
    const labels = labelRepositoryMock();
    jest.mocked(labels.findManyByNames).mockResolvedValue([
      { id: 'label-1', userId: 'user-id', name: 'Ev', normalizedName: 'ev', color: null, version: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);
    jest.mocked(taskService.createTask).mockImplementation(async () => ({
      outcome: 'SUCCESS',
      task: {
        id: 'task-1',
        userId: 'user-id',
        areaId: 'area-1',
        title: 'Haftalık Rapor',
        description: 'İlerleme raporunu hazırla',
        plannedAt: new Date(),
        dueAt: null,
        priority: 'HIGH',
        areaStatusId: 'status-1',
        projectId: null,
        parentTaskId: null,
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
      },
      etag: 1,
    }));
    const service = serviceFrom(repository, taskService, labels);

    const result = await service.applyTemplate('user-id', {
      templateId: 'template-1',
      areaId: 'area-1',
    });

    expect(result.outcome).toBe('SUCCESS');
    expect(taskService.createTask).toHaveBeenCalledTimes(1);
    const command = jest.mocked(taskService.createTask).mock.calls[0]?.[1];
    expect(command).toBeDefined();
    if (!command) {
      return;
    }
    expect(command).toMatchObject({
      title: 'Haftalık Rapor',
      description: 'İlerleme raporunu hazırla',
      priority: 'HIGH',
      areaId: 'area-1',
      labelIds: ['label-1'],
      checklistItems: [{ text: 'Veri topla' }, { text: 'Rapor yaz' }],
      dueAt: null,
    });
    expect(command.plannedAt).toBeInstanceOf(Date);
    expect(command.projectId).toBeUndefined();
    expect(labels.findManyByNames).toHaveBeenCalledWith('user-id', ['ev', 'mevcut olmayan']);
  });

  it('returns NOT_FOUND for unknown template', async () => {
    const repository = repositoryMock();
    jest.mocked(repository.findById).mockResolvedValue(null);
    const service = serviceMock(repository);

    const result = await service.applyTemplate('user-id', { templateId: 'missing' });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });
});

function serviceMock(repository: jest.Mocked<TaskTemplateRepository>): TaskTemplateService {
  return serviceFrom(repository, taskServiceMock(), labelRepositoryMock());
}

function serviceFrom(
  repository: jest.Mocked<TaskTemplateRepository>,
  taskService: jest.Mocked<TaskService>,
  labels: jest.Mocked<LabelRepository>,
): TaskTemplateService {
  return new TaskTemplateService(repository, taskService as never, labels as never);
}

function repositoryMock(): jest.Mocked<TaskTemplateRepository> {
  return {
    create: jest.fn(async () => TEMPLATE),
    findById: jest.fn(async () => TEMPLATE),
    findVersion: jest.fn(async () => 1),
    list: jest.fn(async () => ({ templates: [] })),
    update: jest.fn(async () => TEMPLATE),
    delete: jest.fn(async () => true),
  } as unknown as jest.Mocked<TaskTemplateRepository>;
}

function taskServiceMock(): jest.Mocked<TaskService> {
  return {
    createTask: jest.fn(),
  } as unknown as jest.Mocked<TaskService>;
}

function labelRepositoryMock(): jest.Mocked<LabelRepository> {
  return {
    findManyByNames: jest.fn(async () => []),
  } as unknown as jest.Mocked<LabelRepository>;
}