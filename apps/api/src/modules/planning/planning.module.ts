import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { ChecklistItemService } from './application/checklist-item.service';
import { LabelService } from './application/label.service';
import { TaskService } from './application/task.service';
import { AreaRepository } from './infrastructure/area.repository';
import { ChecklistItemRepository } from './infrastructure/checklist-item.repository';
import { LabelRepository } from './infrastructure/label.repository';
import { TaskRepository } from './infrastructure/task.repository';
import { AreaController } from './transport/area.controller';
import { ChecklistController } from './transport/checklist.controller';
import { ChecklistOrderController } from './transport/checklist-order.controller';
import { LabelController } from './transport/label.controller';
import { TaskController } from './transport/task.controller';

@Module({
  imports: [AccountsModule],
  controllers: [
    AreaController,
    TaskController,
    LabelController,
    ChecklistController,
    ChecklistOrderController,
  ],
  providers: [
    AreaService,
    AreaRepository,
    TaskService,
    TaskRepository,
    LabelService,
    LabelRepository,
    ChecklistItemService,
    ChecklistItemRepository,
  ],
  exports: [AreaService, TaskService, LabelService, ChecklistItemService],
})
export class PlanningModule {}
