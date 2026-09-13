import { describe, expect, it, jest } from '@jest/globals';

import { AreaService } from '../../src/modules/planning/application/area.service';
import type { AreaRepository } from '../../src/modules/planning/infrastructure/area.repository';

describe('area service', () => {
  it('validates area name is not blank', async () => {
    const service = new AreaService(repositoryMock());

    const result = await service.createArea('user-id', { name: '' });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Alan adı boş olamaz.',
    });
  });

  it('validates area name length', async () => {
    const service = new AreaService(repositoryMock());

    const result = await service.createArea('user-id', { name: 'a'.repeat(101) });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Alan adı 100 karakterden uzun olamaz.',
    });
  });

  it('creates area with valid name', async () => {
    const repository = repositoryMock();
    repository.createArea.mockResolvedValue({
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
      statuses: [
        {
          id: 'status-1',
          userId: 'user-id',
          areaId: 'area-id',
          name: 'Yapılacak',
          normalizedName: 'yapilacak',
          canonicalStatus: 'TO_DO',
          position: 1,
          isDefault: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const service = new AreaService(repository);
    const result = await service.createArea('user-id', { name: 'Test Area' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      area: expect.objectContaining({ id: 'area-id', name: 'Test Area' }),
      statuses: expect.arrayContaining([expect.objectContaining({ id: 'status-1' })]),
    });
  });

  it('returns NOT_FOUND for non-existent area', async () => {
    const repository = repositoryMock();
    repository.findById.mockResolvedValue(null);

    const service = new AreaService(repository);
    const result = await service.getArea('user-id', { areaId: 'non-existent' });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });

  it('returns area detail for existing area', async () => {
    const repository = repositoryMock();
    repository.findById.mockResolvedValue({
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
      taskCount: 5,
      projectCount: 2,
    });

    const service = new AreaService(repository);
    const result = await service.getArea('user-id', { areaId: 'area-id' });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      data: expect.objectContaining({
        area: expect.objectContaining({ id: 'area-id' }),
        taskCount: 5,
        projectCount: 2,
      }),
    });
  });

  it('lists areas for user', async () => {
    const repository = repositoryMock();
    repository.listByUser.mockResolvedValue({
      areas: [
        {
          id: 'area-id',
          name: 'Test Area',
          isInbox: false,
          lifecycleState: 'ACTIVE',
          taskCount: 5,
          projectCount: 1,
          overdueTaskCount: 0,
        },
      ],
    });

    const service = new AreaService(repository);
    const result = await service.listAreas('user-id', {});

    expect(result).toEqual({
      outcome: 'SUCCESS',
      areas: expect.arrayContaining([expect.objectContaining({ id: 'area-id' })]),
      nextCursor: undefined,
    });
  });

  it('validates rename area name', async () => {
    const service = new AreaService(repositoryMock());

    const result = await service.renameArea('user-id', {
      areaId: 'area-id',
      name: '',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'VALIDATION_ERROR',
      detail: 'Alan adı boş olamaz.',
    });
  });

  it('renames area with valid name', async () => {
    const repository = repositoryMock();
    repository.updateName.mockResolvedValue({
      id: 'area-id',
      userId: 'user-id',
      name: 'New Name',
      normalizedName: 'new name',
      isInbox: false,
      lifecycleState: 'ACTIVE',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const service = new AreaService(repository);
    const result = await service.renameArea('user-id', {
      areaId: 'area-id',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({
      outcome: 'SUCCESS',
      area: expect.objectContaining({ id: 'area-id', name: 'New Name', version: 2 }),
    });
  });

  it('returns STALE_VERSION when update fails', async () => {
    const repository = repositoryMock();
    repository.updateName.mockResolvedValue(null);
    repository.findById.mockResolvedValue({
      area: {
        id: 'area-id',
        userId: 'user-id',
        name: 'Old Name',
        normalizedName: 'old name',
        isInbox: false,
        lifecycleState: 'ACTIVE',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      statuses: [],
      taskCount: 0,
      projectCount: 0,
    });

    const service = new AreaService(repository);
    const result = await service.renameArea('user-id', {
      areaId: 'area-id',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'STALE_VERSION' });
  });

  it('returns NOT_FOUND when renaming non-existent area', async () => {
    const repository = repositoryMock();
    repository.updateName.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null);

    const service = new AreaService(repository);
    const result = await service.renameArea('user-id', {
      areaId: 'non-existent',
      name: 'New Name',
      version: 1,
    });

    expect(result).toEqual({ outcome: 'NOT_FOUND' });
  });
});

function repositoryMock(): jest.Mocked<AreaRepository> {
  return {
    createArea: jest.fn(),
    findInbox: jest.fn(),
    ensureInbox: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    updateName: jest.fn(),
    createStatus: jest.fn(),
    updateStatusName: jest.fn(),
    retireStatus: jest.fn(),
    activateStatus: jest.fn(),
    reorderStatuses: jest.fn(),
  } as unknown as jest.Mocked<AreaRepository>;
}
