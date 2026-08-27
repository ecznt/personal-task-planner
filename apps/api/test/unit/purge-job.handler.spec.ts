import { describe, expect, it, jest } from '@jest/globals';

import { PurgeJobHandler } from '../../src/modules/planning/application/purge-job.handler';
import type { PurgeService } from '../../src/modules/planning/application/purge.service';

describe('purge job handler', () => {
  it('calls the purge service and returns receipts count', async () => {
    const purge = {
      purgeExpiredTombstones: jest.fn(async () => ({ receipts: 3 })),
    } as unknown as PurgeService;

    const handler = new PurgeJobHandler(purge);

    const result = await handler.handle();

    expect(purge.purgeExpiredTombstones).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ receipts: 3 });
  });
});
