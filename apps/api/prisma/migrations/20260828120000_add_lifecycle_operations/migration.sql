-- CreateEnum
CREATE TYPE "LifecycleOperationKind" AS ENUM ('ARCHIVE', 'TRASH', 'RESTORE', 'PERMANENT_DELETE');

-- CreateEnum
CREATE TYPE "LifecycleOperationState" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LifecycleEntityKind" AS ENUM ('AREA', 'PROJECT', 'TASK');

-- AlterTable
ALTER TABLE "areas" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3),
ADD COLUMN     "currentLifecycleOperationId" UUID,
ADD COLUMN     "purgeAfter" TIMESTAMPTZ(3),
ADD COLUMN     "trashedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3),
ADD COLUMN     "currentLifecycleOperationId" UUID,
ADD COLUMN     "purgeAfter" TIMESTAMPTZ(3),
ADD COLUMN     "trashedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3),
ADD COLUMN     "currentLifecycleOperationId" UUID,
ADD COLUMN     "purgeAfter" TIMESTAMPTZ(3),
ADD COLUMN     "trashedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "lifecycle_operations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "LifecycleOperationKind" NOT NULL,
    "rootKind" "LifecycleEntityKind" NOT NULL,
    "rootId" UUID NOT NULL,
    "state" "LifecycleOperationState" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "failureSummary" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lifecycle_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_effects" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "affectedKind" "LifecycleEntityKind" NOT NULL,
    "affectedId" UUID NOT NULL,
    "previousState" "PlanningLifecycleState" NOT NULL,
    "resultingState" "PlanningLifecycleState" NOT NULL,
    "effectTime" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousArchivedAt" TIMESTAMPTZ(3),
    "previousTrashedAt" TIMESTAMPTZ(3),
    "previousPurgeAfter" TIMESTAMPTZ(3),
    "reversedAt" TIMESTAMPTZ(3),
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "replacementAreaId" UUID,
    "replacementProjectId" UUID,

    CONSTRAINT "lifecycle_effects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lifecycle_op_user_root_idx" ON "lifecycle_operations"("userId", "kind", "rootKind", "rootId");

-- CreateIndex
CREATE INDEX "lifecycle_op_user_started_idx" ON "lifecycle_operations"("userId", "startedAt", "id");

-- CreateIndex
CREATE INDEX "lifecycle_effect_operation_reversed_idx" ON "lifecycle_effects"("operationId", "reversed");

-- CreateIndex
CREATE INDEX "lifecycle_effect_entity_idx" ON "lifecycle_effects"("userId", "affectedKind", "affectedId");

-- CreateIndex
CREATE INDEX "area_user_purge_idx" ON "areas"("userId", "lifecycleState", "purgeAfter", "id");

-- CreateIndex
CREATE INDEX "project_user_purge_idx" ON "projects"("userId", "lifecycleState", "purgeAfter", "id");

-- CreateIndex
CREATE INDEX "task_user_purge_idx" ON "tasks"("userId", "lifecycleState", "purgeAfter", "id");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_currentLifecycleOperationId_fkey" FOREIGN KEY ("currentLifecycleOperationId") REFERENCES "lifecycle_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_currentLifecycleOperationId_fkey" FOREIGN KEY ("currentLifecycleOperationId") REFERENCES "lifecycle_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_currentLifecycleOperationId_fkey" FOREIGN KEY ("currentLifecycleOperationId") REFERENCES "lifecycle_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_operations" ADD CONSTRAINT "lifecycle_operations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_effects" ADD CONSTRAINT "lifecycle_effects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_effects" ADD CONSTRAINT "lifecycle_effects_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "lifecycle_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_effects" ADD CONSTRAINT "lifecycle_effects_affected_area_fkey" FOREIGN KEY ("affectedId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_effects" ADD CONSTRAINT "lifecycle_effects_affected_project_fkey" FOREIGN KEY ("affectedId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_effects" ADD CONSTRAINT "lifecycle_effects_affected_task_fkey" FOREIGN KEY ("affectedId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
