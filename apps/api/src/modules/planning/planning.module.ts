import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { AreaRepository } from './infrastructure/area.repository';
import { AreaController } from './transport/area.controller';

@Module({
  imports: [AccountsModule],
  controllers: [AreaController],
  providers: [AreaService, AreaRepository],
  exports: [AreaService],
})
export class PlanningModule {}
