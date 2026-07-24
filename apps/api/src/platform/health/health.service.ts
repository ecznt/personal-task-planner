import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async assertDatabaseReady(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Required infrastructure is unavailable');
    }
  }
}
