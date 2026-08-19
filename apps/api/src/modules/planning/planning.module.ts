import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { TaskService } from './application/task.service';
import { AreaRepository } from './infrastructure/area.repository';
import { TaskRepository } from './infrastructure/task.repository';
import { AreaController } from './transport/area.controller';
import { TaskController } from './transport/task.controller';

@Module({
  imports: [AccountsModule],
  controllers: [AreaController, TaskController],
  providers: [AreaService, AreaRepository, TaskService, TaskRepository],
  exports: [AreaService, TaskService],
})
export class PlanningModule {}
