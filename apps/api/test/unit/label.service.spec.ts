import { describe, expect, it, jest } from '@jest/globals';

import { DEFAULT_LABEL_COLOR, LabelService } from '../../src/modules/planning/application/label.service';
import type { Label } from '../../src/modules/planning/domain/label.entity';
import type { LabelRepository } from '../../src/modules/planning/infrastructure/label.repository';

const label: Label = {
  id: 'label-id',
  userId: 'user-id',
  name: 'Acil',
  normalizedName: 'acil',
  color: '#dc2626',
  version: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('label service — color', () => {
  it('persists a provided color when creating a label', async () => {
    const repository = repositoryMock();
    repository.findByName.mockResolvedValue(null);
    repository.createLabel.mockResolvedValue(label);

    const service = new LabelService(repository);
    const result = await service.createLabel('user-id', { name: 'Acil', color: '#dc2626' });

    expect(result.outcome).toBe('SUCCESS');
    expect(repository.createLabel).toHaveBeenCalledWith('user-id', 'Acil', 'acil', '#dc2626');
  });

  it('falls back to the default color when none is provided', async () => {
    const repository = repositoryMock();
    repository.findByName.mockResolvedValue(null);
    repository.createLabel.mockResolvedValue(label);

    const service = new LabelService(repository);
    await service.createLabel('user-id', { name: 'Acil' });

    expect(repository.createLabel).toHaveBeenCalledWith(
      'user-id',
      'Acil',
      'acil',
      DEFAULT_LABEL_COLOR,
    );
  });

  it('passes the new color when renaming a label', async () => {
    const repository = repositoryMock();
    repository.findByName.mockResolvedValue(null);
    repository.updateName.mockResolvedValue({ ...label, color: '#16a34a', version: 2 });

    const service = new LabelService(repository);
    const result = await service.renameLabel('user-id', {
      labelId: 'label-id',
      name: 'Acil',
      version: 1,
      color: '#16a34a',
    });

    expect(result.outcome).toBe('SUCCESS');
    expect(repository.updateName).toHaveBeenCalledWith(
      'user-id',
      'label-id',
      'Acil',
      'acil',
      1,
      '#16a34a',
    );
  });

  it('keeps the existing color when renaming without a color', async () => {
    const repository = repositoryMock();
    repository.findByName.mockResolvedValue(null);
    repository.updateName.mockResolvedValue({ ...label, version: 2 });

    const service = new LabelService(repository);
    await service.renameLabel('user-id', {
      labelId: 'label-id',
      name: 'Acil',
      version: 1,
    });

    expect(repository.updateName).toHaveBeenCalledWith(
      'user-id',
      'label-id',
      'Acil',
      'acil',
      1,
      undefined,
    );
  });
});

function repositoryMock(): jest.Mocked<LabelRepository> {
  return {
    createLabel: jest.fn(),
    findByName: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    updateName: jest.fn(),
    delete: jest.fn(),
    findVersion: jest.fn(),
  } as unknown as jest.Mocked<LabelRepository>;
}
