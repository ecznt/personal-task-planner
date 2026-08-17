CREATE TYPE "CanonicalStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'COMPLETED');

CREATE TYPE "PlanningLifecycleState" AS ENUM ('ACTIVE', 'ARCHIVED', 'TRASHED');

CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "areas" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "lifecycleState" "PlanningLifecycleState" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "area_statuses" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "areaId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "canonicalStatus" "CanonicalStatus" NOT NULL,
  "position" INTEGER NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "area_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "areaId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "lifecycleState" "PlanningLifecycleState" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "areaId" UUID NOT NULL,
  "projectId" UUID,
  "areaStatusId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "plannedAt" TIMESTAMP(3) WITH TIME ZONE,
  "dueAt" TIMESTAMP(3) WITH TIME ZONE,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "completedAt" TIMESTAMP(3) WITH TIME ZONE,
  "lifecycleState" "PlanningLifecycleState" NOT NULL DEFAULT 'ACTIVE',
  "globalRank" TEXT NOT NULL,
  "areaRank" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "labels" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "color" TEXT,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_labels" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "labelId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_labels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_items" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "completedAt" TIMESTAMP(3) WITH TIME ZONE,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

  CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "area_user_normalized_name_key" ON "areas"("userId", "normalizedName");
CREATE INDEX "area_user_lifecycle_idx" ON "areas"("userId", "lifecycleState", "updatedAt", "id");

CREATE UNIQUE INDEX "area_status_area_normalized_name_key" ON "area_statuses"("areaId", "normalizedName");
CREATE UNIQUE INDEX "area_status_area_position_key" ON "area_statuses"("areaId", "position");
CREATE INDEX "area_status_default_lookup_idx" ON "area_statuses"("userId", "areaId", "canonicalStatus", "isDefault");

CREATE UNIQUE INDEX "project_area_normalized_name_key" ON "projects"("areaId", "normalizedName");
CREATE INDEX "project_user_lifecycle_idx" ON "projects"("userId", "lifecycleState", "updatedAt", "id");

CREATE INDEX "task_user_lifecycle_idx" ON "tasks"("userId", "lifecycleState", "updatedAt", "id");
CREATE INDEX "task_area_rank_idx" ON "tasks"("userId", "areaId", "lifecycleState", "areaRank", "id");
CREATE INDEX "task_global_rank_idx" ON "tasks"("userId", "lifecycleState", "globalRank", "id");
CREATE INDEX "task_user_due_idx" ON "tasks"("userId", "dueAt", "id");

CREATE UNIQUE INDEX "label_user_normalized_name_key" ON "labels"("userId", "normalizedName");

CREATE UNIQUE INDEX "task_label_user_task_label_key" ON "task_labels"("userId", "taskId", "labelId");
CREATE INDEX "task_label_user_label_idx" ON "task_labels"("userId", "labelId", "taskId");

CREATE UNIQUE INDEX "checklist_item_task_position_key" ON "checklist_items"("taskId", "position");
CREATE INDEX "checklist_item_user_task_position_idx" ON "checklist_items"("userId", "taskId", "position");

ALTER TABLE "areas" ADD CONSTRAINT "areas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "area_statuses" ADD CONSTRAINT "area_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "area_statuses" ADD CONSTRAINT "area_statuses_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_areaStatusId_fkey" FOREIGN KEY ("areaStatusId") REFERENCES "area_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "labels" ADD CONSTRAINT "labels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
