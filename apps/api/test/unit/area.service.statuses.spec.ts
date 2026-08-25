import { describe, expect, it, jest } from '@jest/globals';

import { AreaService } from '../../src/modules/planning/application/area.service';
import type { AreaRepository } from '../../src/modules/planning/infrastructure/area.repository';

describe('area service — createAreaStatus', () => {
  it('creates a status with valid input', async () => {
    const repository = repositoryMock();
    repository.createStatus.mockResolvedValue({
      status: {
        id: 'status-1',
        userId: 'user-id',
        areaId: 'area-1',
        name: 'İnceleme',
        normalizedName: 'inceleme',
        canonicalStatus: 'IN_PROGRESS',
        position: 4,
        isDefault: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      areaVersion: 2,
    });

    const service = new AreaService(repository);
    const result = await service.createAreaStatus('user-id', {
      areaId: 'area-1',
      name: 'İnceleme',
      canonicalStatus: 'IN_PROGRESS',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
  });

  it('rejects empty name', async () => {
    const repository = repositoryMock();
    const service = new AreaService(repository);
    const result = await service.createAreaStatus('user-id', {
      areaId: 'area-1',
      name: '',
      canonicalStatus: 'TO_DO',
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });

  it('returns NOT_FOUND for nonexistent area', async () => {
    const repository = repositoryMock();
    repository.createStatus.mockResolvedValue({ error: 'NOT_FOUND' });

    const service = new AreaService(repository);
    const result = await service.createAreaStatus('user-id', {
      areaId: 'nonexistent',
      name: 'Test',
      canonicalStatus: 'TO_DO',
      version: 1,
    });

    expect(result.outcome).toBe('NOT_FOUND');
  });

  it('returns VALIDATION_ERROR for duplicate name', async () => {
    const repository = repositoryMock();
    repository.createStatus.mockResolvedValue({ error: 'DUPLICATE_NAME' });

    const service = new AreaService(repository);
    const result = await service.createAreaStatus('user-id', {
      areaId: 'area-1',
      name: 'Yapılacak',
      canonicalStatus: 'TO_DO',
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });
});

describe('area service — updateAreaStatusName', () => {
  it('renames a status', async () => {
    const repository = repositoryMock();
    repository.updateStatusName.mockResolvedValue({
      status: {
        id: 'status-1',
        userId: 'user-id',
        areaId: 'area-1',
        name: 'Yeni Ad',
        normalizedName: 'yeni ad',
        canonicalStatus: 'TO_DO',
        position: 1,
        isDefault: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      areaVersion: 2,
    });

    const service = new AreaService(repository);
    const result = await service.updateAreaStatusName('user-id', {
      areaId: 'area-1',
      statusId: 'status-1',
      name: 'Yeni Ad',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
  });

  it('rejects renaming default status', async () => {
    const repository = repositoryMock();
    repository.updateStatusName.mockResolvedValue({ error: 'CANNOT_RENAME_DEFAULT' });

    const service = new AreaService(repository);
    const result = await service.updateAreaStatusName('user-id', {
      areaId: 'area-1',
      statusId: 'status-1',
      name: 'Yeni Ad',
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });
});

describe('area service — retireAreaStatus', () => {
  it('retires a status and reports migrated tasks', async () => {
    const repository = repositoryMock();
    repository.retireStatus.mockResolvedValue({ areaVersion: 2, migratedCount: 3 });

    const service = new AreaService(repository);
    const result = await service.retireAreaStatus('user-id', {
      areaId: 'area-1',
      statusId: 'status-1',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
    if (result.outcome === 'SUCCESS') {
      expect(result.migratedCount).toBe(3);
    }
  });

  it('rejects retiring default status', async () => {
    const repository = repositoryMock();
    repository.retireStatus.mockResolvedValue({ error: 'CANNOT_RETIRE_DEFAULT' });

    const service = new AreaService(repository);
    const result = await service.retireAreaStatus('user-id', {
      areaId: 'area-1',
      statusId: 'status-1',
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });
});

describe('area service — activateAreaStatus', () => {
  it('activates a retired status', async () => {
    const repository = repositoryMock();
    repository.activateStatus.mockResolvedValue({ areaVersion: 2 });

    const service = new AreaService(repository);
    const result = await service.activateAreaStatus('user-id', {
      areaId: 'area-1',
      statusId: 'status-1',
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
  });
});

describe('area service — reorderAreaStatuses', () => {
  it('reorders statuses', async () => {
    const repository = repositoryMock();
    repository.reorderStatuses.mockResolvedValue({ areaVersion: 2 });

    const service = new AreaService(repository);
    const result = await service.reorderAreaStatuses('user-id', {
      areaId: 'area-1',
      statusIds: ['s2', 's1', 's3'],
      version: 1,
    });

    expect(result.outcome).toBe('SUCCESS');
  });

  it('rejects empty list', async () => {
    const repository = repositoryMock();
    const service = new AreaService(repository);
    const result = await service.reorderAreaStatuses('user-id', {
      areaId: 'area-1',
      statusIds: [],
      version: 1,
    });

    expect(result.outcome).toBe('VALIDATION_ERROR');
  });
});

function repositoryMock(): jest.Mocked<AreaRepository> {
  return {
    createArea: jest.fn(),
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
