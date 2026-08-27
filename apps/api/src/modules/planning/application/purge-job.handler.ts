import { Inject, Injectable } from '@nestjs/common';

import { PurgeService } from './purge.service';

@Injectable()
export class PurgeJobHandler {
  constructor(@Inject(PurgeService) private readonly purge: PurgeService) {}

  async handle(): Promise<{ readonly receipts: number }> {
    return this.purge.purgeExpiredTombstones();
  }
}
