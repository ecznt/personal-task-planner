import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { ChecklistItemService } from './application/checklist-item.service';
import { LabelService } from './application/label.service';
import { ProjectService } from './application/project.service';
import { RecurrenceService } from './application/recurrence.service';
import { SearchService } from './application/search.service';
import { TaskService } from './application/task.service';
import { AreaRepository } from './infrastructure/area.repository';
import { ChecklistItemRepository } from './infrastructure/checklist-item.repository';
import { LabelRepository } from './infrastructure/label.repository';
import { ProjectRepository } from './infrastructure/project.repository';
import { RecurrenceRepository } from './infrastructure/recurrence.repository';
import { TaskRepository } from './infrastructure/task.repository';
import { AreaController } from './transport/area.controller';
import { ChecklistController } from './transport/checklist.controller';
import { ChecklistOrderController } from './transport/checklist-order.controller';
import { LabelController } from './transport/label.controller';
import { ProjectController } from './transport/project.controller';
import { RecurrenceController } from './transport/recurrence.controller';
import { SearchController } from './transport/search.controller';
import { TaskController } from './transport/task.controller';

@Module({
  imports: [AccountsModule],
  controllers: [
    AreaController,
    TaskController,
    RecurrenceController,
    LabelController,
    ChecklistController,
    ChecklistOrderController,
    ProjectController,
    SearchController,
  ],
  providers: [
    AreaService,
    AreaRepository,
    TaskService,
    TaskRepository,
    RecurrenceService,
    RecurrenceRepository,
    SearchService,
    LabelService,
    LabelRepository,
    ChecklistItemService,
    ChecklistItemRepository,
    ProjectService,
    ProjectRepository,
  ],
  exports: [AreaService, TaskService, RecurrenceService, SearchService, LabelService, ChecklistItemService, ProjectService],
})
export class PlanningModule {}
