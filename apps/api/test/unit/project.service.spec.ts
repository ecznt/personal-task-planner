import { describe, expect, it, jest } from '@jest/globals';

import { ProjectService } from '../../src/modules/planning/application/project.service';
import type { ProjectRepository } from '../../src/modules/planning/infrastructure/project.repository';
import type { AreaRepository } from '../../src/modules/planning/infrastructure/area.repository';

describe('project service', () => {
  it('validates project name is not blank', async () => {
    const service = new ProjectService(projectRepositoryMock(), areaRepositoryMock());

    const result = await service.createProject('user-id', { areaId: 'area-id', name: '  ' });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Proje adı boş olamaz.',
    });
  });

  it('validates project name length', async () => {
    const service = new ProjectService(projectRepositoryMock(), areaRepositoryMock());

    const result = await service.createProject('user-id', {
      areaId: 'area-id',
      name: 'a'.repeat(101),
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Proje adı en fazla 100 karakter olabilir.',
    });
  });

  it('returns NOT_FOUND when area does not exist', async () => {
    const areas = areaRepositoryMock();
    areas.findById.mockResolvedValue(null);

    const service = new ProjectService(projectRepositoryMock(), areas);
    const result = await service.createProject('user-id', {
      areaId: 'non-existent',
      name: 'My Project',
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns DUPLICATE_NAME for same normalizedName in area', async () => {
    const areas = areaRepositoryMock();
    areas.findById.mockResolvedValue({
      area: {
        id: 'area-id',
        userId: 'user-id',
        name: 'Test Area',
        normalizedName: 'test area',
        isInbox: false,
        lifecycleState: 'ACTIVE',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      statuses: [],
      taskCount: 0,
      projectCount: 0,
    });
    const projects = projectRepositoryMock();
    projects.findByNormalized.mockResolvedValue({ id: 'existing-id' });

    const service = new ProjectService(projects, areas);
    const result = await service.createProject('user-id', {
      areaId: 'area-id',
      name: 'My Project',
    });

    expect(result).toEqual({
      outcome: 'DUPLICATE_NAME',
      detail: 'Bu alanda aynı isimde bir proje zaten mevcut.',
    });
  });

  it('creates project with valid name', async () => {
    const areas = areaRepositoryMock();
    areas.findById.mockResolvedValue({
      area: {
        id: 'area-id',
        userId: 'user-id',
        name: 'Test Area',
        normalizedName: 'test area',
        isInbox: false,
        lifecycleState: 'ACTIVE',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      statuses: [],
      taskCount: 0,
      projectCount: 0,
    });
    const projects = projectRepositoryMock();
    projects.findByNormalized.mockResolvedValue(null);
    projects.createProject.mockResolvedValue({
      id: 'project-id',
      userId: 'user-id',
      areaId: 'area-id',
      name: 'My Project',
      normalizedName: 'my project',
      lifecycleState: 'ACTIVE',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const service = new ProjectService(projects, areas);
    const result = await service.createProject('user-id', {
      areaId: 'area-id',
      name: 'My Project',
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      project: expect.objectContaining({ id: 'project-id', name: 'My Project' }),
      etag: 1,
    });
  });

  it('returns NOT_FOUND for non-existent project on get', async () => {
    const projects = projectRepositoryMock();
    projects.findById.mockResolvedValue(null);

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.getProject('user-id', { projectId: 'non-existent' });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns project detail for existing project', async () => {
    const projects = projectRepositoryMock();
    projects.findById.mockResolvedValue({
      id: 'project-id',
      areaId: 'area-id',
      name: 'My Project',
      lifecycleState: 'ACTIVE',
      version: 1,
      taskCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.getProject('user-id', { projectId: 'project-id' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      project: expect.objectContaining({ id: 'project-id', taskCount: 3 }),
      etag: 1,
    });
  });

  it('lists projects for an area', async () => {
    const projects = projectRepositoryMock();
    projects.listByArea.mockResolvedValue({
      projects: [
        {
          id: 'p1',
          areaId: 'area-id',
          name: 'Project 1',
          lifecycleState: 'ACTIVE',
          version: 1,
          taskCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.listProjects('user-id', { areaId: 'area-id' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      projects: expect.arrayContaining([expect.objectContaining({ id: 'p1' })]),
    });
  });

  it('validates rename project name', async () => {
    const service = new ProjectService(projectRepositoryMock(), areaRepositoryMock());

    const result = await service.renameProject('user-id', {
      projectId: 'project-id',
      name: '',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Proje adı boş olamaz.',
    });
  });

  it('renames project with valid name', async () => {
    const projects = projectRepositoryMock();
    projects.findById.mockResolvedValue({
      id: 'project-id',
      areaId: 'area-id',
      name: 'Old Name',
      lifecycleState: 'ACTIVE',
      version: 1,
      taskCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    projects.findByNormalized.mockResolvedValue(null);
    projects.updateName.mockResolvedValue({
      id: 'project-id',
      userId: 'user-id',
      areaId: 'area-id',
      name: 'New Name',
      normalizedName: 'new name',
      lifecycleState: 'ACTIVE',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.renameProject('user-id', {
      projectId: 'project-id',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      project: expect.objectContaining({ id: 'project-id', name: 'New Name', version: 2 }),
      etag: 2,
    });
  });

  it('returns NOT_FOUND when renaming non-existent project', async () => {
    const projects = projectRepositoryMock();
    projects.findById.mockResolvedValue(null);

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.renameProject('user-id', {
      projectId: 'non-existent',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns STALE_VERSION when update fails', async () => {
    const projects = projectRepositoryMock();
    projects.findById
      .mockResolvedValueOnce({
        id: 'project-id',
        areaId: 'area-id',
        name: 'Old Name',
        lifecycleState: 'ACTIVE',
        version: 2,
        taskCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'project-id',
        areaId: 'area-id',
        name: 'Old Name',
        lifecycleState: 'ACTIVE',
        version: 2,
        taskCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    projects.updateName.mockResolvedValue(null);
    projects.findByNormalized.mockResolvedValue(null);

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.renameProject('user-id', {
      projectId: 'project-id',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'STALE_VERSION' });
  });

  it('returns DUPLICATE_NAME when renaming to existing name', async () => {
    const projects = projectRepositoryMock();
    projects.findById.mockResolvedValue({
      id: 'project-id',
      areaId: 'area-id',
      name: 'Old Name',
      lifecycleState: 'ACTIVE',
      version: 1,
      taskCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    projects.findByNormalized.mockResolvedValue({ id: 'other-project' });

    const service = new ProjectService(projects, areaRepositoryMock());
    const result = await service.renameProject('user-id', {
      projectId: 'project-id',
      name: 'Existing Name',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'DUPLICATE_NAME',
      detail: 'Bu alanda aynı isimde bir proje zaten mevcut.',
    });
  });
});

function projectRepositoryMock(): jest.Mocked<ProjectRepository> {
  return {
    createProject: jest.fn(),
    findById: jest.fn(),
    listByArea: jest.fn(),
    updateName: jest.fn(),
    findByNormalized: jest.fn(),
    projectExists: jest.fn(),
    projectBelongsToArea: jest.fn(),
  } as unknown as jest.Mocked<ProjectRepository>;
}

function areaRepositoryMock(): jest.Mocked<AreaRepository> {
  return {
    createArea: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    updateName: jest.fn(),
  } as unknown as jest.Mocked<AreaRepository>;
}
