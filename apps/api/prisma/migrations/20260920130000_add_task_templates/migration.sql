-- CreateTable
CREATE TABLE "task_templates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "checklistSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labelNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultPlannedAtOffsetDays" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_template_user_updated_idx" ON "task_templates"("userId", "updatedAt", "id");

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;