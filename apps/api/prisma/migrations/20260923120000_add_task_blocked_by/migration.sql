-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "blockedByTaskIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
