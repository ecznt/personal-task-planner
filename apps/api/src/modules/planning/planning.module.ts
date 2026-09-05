import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AreaService } from './application/area.service';
import { BulkActionService } from './application/bulk-action.service';
import { ChecklistItemService } from './application/checklist-item.service';
import { LabelService } from './application/label.service';
import { LifecycleService } from './application/lifecycle.service';
import { NotificationService } from './application/notification.service';
import { ProjectService } from './application/project.service';
import { RecurrenceService } from './application/recurrence.service';
import { ReminderService } from './application/reminder.service';
import { SearchService } from './application/search.service';
import { TaskService } from './application/task.service';
import { AreaRepository } from './infrastructure/area.repository';
import { ChecklistItemRepository } from './infrastructure/checklist-item.repository';
import { LabelRepository } from './infrastructure/label.repository';
import { LifecycleRepository } from './infrastructure/lifecycle.repository';
import { ProjectRepository } from './infrastructure/project.repository';
import { RecurrenceRepository } from './infrastructure/recurrence.repository';
import { ReminderRepository } from './infrastructure/reminder.repository';
import { TaskRepository } from './infrastructure/task.repository';
import { AreaController } from './transport/area.controller';
import { ArchiveController } from './transport/archive.controller';
import { BulkActionController } from './transport/bulk.controller';
import { ChecklistController } from './transport/checklist.controller';
import { ChecklistOrderController } from './transport/checklist-order.controller';
import { LabelController } from './transport/label.controller';
import { LifecycleActionsController } from './transport/lifecycle-actions.controller';
import { NotificationController } from './transport/notification.controller';
import { ProjectController } from './transport/project.controller';
import { RecurrenceController } from './transport/recurrence.controller';
import { ReminderController } from './transport/reminder.controller';
import { SearchController } from './transport/search.controller';
import { TaskController } from './transport/task.controller';
import { TrashController } from './transport/trash.controller';

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
    ArchiveController,
    TrashController,
    LifecycleActionsController,
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
    LifecycleService,
    LifecycleRepository,
  ],
  exports: [
    AreaService,
    TaskService,
    RecurrenceService,
    ReminderService,
    NotificationService,
    SearchService,
    BulkActionService,
    LabelService,
    ChecklistItemService,
    ProjectService,
    LifecycleService,
  ],
})
export class PlanningModule {}
