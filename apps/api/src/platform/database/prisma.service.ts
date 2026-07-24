import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';

import { PrismaClient } from './generated/client/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnApplicationShutdown {
  constructor() {
    const connectionString = z
      .string()
      .url()
      .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'))
      .parse(process.env.DATABASE_URL);

    super({
      adapter: new PrismaPg({
        connectionString,
        max: 10,
      }),
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
