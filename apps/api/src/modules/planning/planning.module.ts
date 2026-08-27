import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { BulkActionService } from './application/bulk-action.service';
import { ChecklistItemService } from './application/checklist-item.service';
import { LabelService } from './application/label.service';
import { NotificationService } from './application/notification.service';
import { ProjectService } from './application/project.service';
import { RecurrenceService } from './application/recurrence.service';
import { ReminderService } from './application/reminder.service';
import { SearchService } from './application/search.service';
import { TaskService } from './application/task.service';
import { AreaRepository } from './infrastructure/area.repository';
import { ChecklistItemRepository } from './infrastructure/checklist-item.repository';
import { LabelRepository } from './infrastructure/label.repository';
import { ProjectRepository } from './infrastructure/project.repository';
import { RecurrenceRepository } from './infrastructure/recurrence.repository';
import { ReminderRepository } from './infrastructure/reminder.repository';
import { TaskRepository } from './infrastructure/task.repository';
import { AreaController } from './transport/area.controller';
import { BulkActionController } from './transport/bulk.controller';
import { ChecklistController } from './transport/checklist.controller';
import { ChecklistOrderController } from './transport/checklist-order.controller';
import { LabelController } from './transport/label.controller';
import { NotificationController } from './transport/notification.controller';
import { ProjectController } from './transport/project.controller';
import { RecurrenceController } from './transport/recurrence.controller';
import { ReminderController } from './transport/reminder.controller';
import { SearchController } from './transport/search.controller';
import { TaskController } from './transport/task.controller';

@Module({
  imports: [AccountsModule],
  controllers: [
    AreaController,
    TaskController,
    RecurrenceController,
    ReminderController,
    NotificationController,
    LabelController,
    ChecklistController,
    ChecklistOrderController,
    ProjectController,
    SearchController,
    BulkActionController,
  ],
  providers: [
    AreaService,
    AreaRepository,
    TaskService,
    TaskRepository,
    RecurrenceService,
    RecurrenceRepository,
    ReminderService,
    ReminderRepository,
    NotificationService,
    SearchService,
    BulkActionService,
    LabelService,
    LabelRepository,
    ChecklistItemService,
    ChecklistItemRepository,
    ProjectService,
    ProjectRepository,
  ],
  exports: [AreaService, TaskService, RecurrenceService, ReminderService, NotificationService, SearchService, BulkActionService, LabelService, ChecklistItemService, ProjectService],
})
export class PlanningModule {}
