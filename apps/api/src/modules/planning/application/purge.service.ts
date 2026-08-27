import { Inject, Injectable } from '@nestjs/common';

import { LifecycleRepository } from '../infrastructure/lifecycle.repository';

@Injectable()
export class PurgeService {
  constructor(@Inject(LifecycleRepository) private readonly repository: LifecycleRepository) {}

  async purgeExpiredTombstones(): Promise<{ readonly receipts: number }> {
    return this.repository.purgeExpiredAcrossAllUsers();
  }
}
