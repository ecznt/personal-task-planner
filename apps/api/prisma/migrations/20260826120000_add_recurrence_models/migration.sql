-- CreateEnum
CREATE TYPE "RecurrenceSeriesState" AS ENUM ('ACTIVE', 'PAUSED', 'STOPPED');

-- CreateEnum
CREATE TYPE "RecurrenceMode" AS ENUM ('CALENDAR_BASED', 'COMPLETION_BASED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RecurrenceRuleState" AS ENUM ('ACTIVE', 'SUPERSEDED', 'STOPPED');

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "availableAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "generationKey" TEXT,
ADD COLUMN     "occurrenceNumber" INTEGER,
ADD COLUMN     "predecessorTaskId" UUID,
ADD COLUMN     "recurrenceRuleVersionId" UUID,
ADD COLUMN     "recurrenceSeriesId" UUID;

-- CreateTable
CREATE TABLE "recurrence_series" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "state" "RecurrenceSeriesState" NOT NULL DEFAULT 'ACTIVE',
    "currentOpenTaskId" UUID,
    "lastCompletedTaskId" UUID,
    "nextOccurrenceNumber" INTEGER NOT NULL DEFAULT 2,
    "activeRuleVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recurrence_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rule_versions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "mode" "RecurrenceMode" NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "selectedWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dayOfMonth" INTEGER,
    "monthOfYear" INTEGER,
    "localTime" TEXT,
    "state" "RecurrenceRuleState" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurrence_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_series_currentOpenTaskId_key" ON "recurrence_series"("currentOpenTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_series_lastCompletedTaskId_key" ON "recurrence_series"("lastCompletedTaskId");

-- CreateIndex
CREATE INDEX "recurrence_series_user_state_idx" ON "recurrence_series"("userId", "state");

-- CreateIndex
CREATE INDEX "recurrence_rule_version_user_idx" ON "recurrence_rule_versions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_rule_version_series_version_key" ON "recurrence_rule_versions"("seriesId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_predecessorTaskId_key" ON "tasks"("predecessorTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_generationKey_key" ON "tasks"("generationKey");

-- CreateIndex
CREATE INDEX "task_recurrence_series_occurrence_idx" ON "tasks"("recurrenceSeriesId", "occurrenceNumber");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrenceRuleVersionId_fkey" FOREIGN KEY ("recurrenceRuleVersionId") REFERENCES "recurrence_rule_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrenceSeriesId_fkey" FOREIGN KEY ("recurrenceSeriesId") REFERENCES "recurrence_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_predecessorTaskId_fkey" FOREIGN KEY ("predecessorTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_series" ADD CONSTRAINT "recurrence_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_series" ADD CONSTRAINT "recurrence_series_currentOpenTaskId_fkey" FOREIGN KEY ("currentOpenTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_series" ADD CONSTRAINT "recurrence_series_lastCompletedTaskId_fkey" FOREIGN KEY ("lastCompletedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_rule_versions" ADD CONSTRAINT "recurrence_rule_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_rule_versions" ADD CONSTRAINT "recurrence_rule_versions_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "recurrence_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

