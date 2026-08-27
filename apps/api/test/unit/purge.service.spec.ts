import { describe, expect, it, jest } from '@jest/globals';

import { PurgeService } from '../../src/modules/planning/application/purge.service';
import type { LifecycleRepository } from '../../src/modules/planning/infrastructure/lifecycle.repository';

function repoMock(): jest.Mocked<LifecycleRepository> {
  return {
    findOrigin: jest.fn(),
    listLifecycleEntries: jest.fn(),
    findAffectedCounts: jest.fn(),
    createOperation: jest.fn(),
    completeOperation: jest.fn(),
    archive: jest.fn(),
    trash: jest.fn(),
    restore: jest.fn(),
    permanentDelete: jest.fn(),
    purgeExpiredAcrossAllUsers: jest.fn(async () => ({ receipts: 0 })),
  } as unknown as jest.Mocked<LifecycleRepository>;
}

describe('purge service', () => {
  it('delegates to the repository and returns receipts count', async () => {
    const repository = repoMock();
    repository.purgeExpiredAcrossAllUsers.mockResolvedValue({ receipts: 12 });

    const service = new PurgeService(repository);

    const result = await service.purgeExpiredTombstones();

    expect(repository.purgeExpiredAcrossAllUsers).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ receipts: 12 });
  });
});
