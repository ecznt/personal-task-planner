import { Module } from '@nestjs/common';

import { PUSH_VAPID_CONFIG, pushVapidConfigFactory } from './application/push-vapid';
import { PushService } from './application/push.service';
import { PurgeJobHandler } from './application/purge-job.handler';
import { PurgeSchedulerService } from './application/purge.scheduler';
import { PurgeService } from './application/purge.service';
import { ReminderNotificationSchedulerService } from './application/reminder-notification-scheduler';
import { LifecycleRepository } from './infrastructure/lifecycle.repository';
import { PushSubscriptionRepository } from './infrastructure/push-subscription.repository';
import { ReminderRepository } from './infrastructure/reminder.repository';
import { PUSH_TRANSPORT, WebPushTransport } from './infrastructure/web-push.transport';

@Module({
  exports: [PurgeJobHandler],
  providers: [
    LifecycleRepository,
    ReminderRepository,
    PushSubscriptionRepository,
    PushService,
    PurgeService,
    PurgeJobHandler,
    PurgeSchedulerService,
    ReminderNotificationSchedulerService,
    { provide: PUSH_TRANSPORT, useClass: WebPushTransport },
    { provide: PUSH_VAPID_CONFIG, useFactory: pushVapidConfigFactory },
  ],
})
export class PlanningWorkerModule {}