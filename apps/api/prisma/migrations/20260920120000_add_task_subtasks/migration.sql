-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "parentTaskId" UUID;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "task_user_parent_idx" ON "tasks"("userId", "parentTaskId");