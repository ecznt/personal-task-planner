-- CreateEnum
CREATE TYPE "ReminderAnchorType" AS ENUM ('PLANNED', 'DUE');

-- CreateEnum
CREATE TYPE "ReminderRuleType" AS ENUM ('OFFSET', 'AT_TIME');

-- CreateEnum
CREATE TYPE "ReminderState" AS ENUM ('SCHEDULED', 'TRIGGERED', 'SUPPRESSED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationReadState" AS ENUM ('UNREAD', 'READ');

-- CreateTable
CREATE TABLE "task_reminders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "anchorType" "ReminderAnchorType" NOT NULL,
    "ruleType" "ReminderRuleType" NOT NULL,
    "offsetMinutes" INTEGER,
    "atTime" TIMESTAMPTZ(3),
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "state" "ReminderState" NOT NULL DEFAULT 'SCHEDULED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "task_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskReminderId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readState" "NotificationReadState" NOT NULL DEFAULT 'UNREAD',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_reminder_unique_def" ON "task_reminders"("taskId", "anchorType", "ruleType", "offsetMinutes", "atTime");

-- CreateIndex
CREATE INDEX "task_reminder_trigger_idx" ON "task_reminders"("state", "scheduledAt", "id");

-- CreateIndex
CREATE INDEX "task_reminder_user_task_idx" ON "task_reminders"("userId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_taskReminderId_key" ON "notifications"("taskReminderId");

-- CreateIndex
CREATE INDEX "notification_user_read_idx" ON "notifications"("userId", "readState", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_taskReminderId_fkey" FOREIGN KEY ("taskReminderId") REFERENCES "task_reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
