-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "availableAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "durationMinutes" INTEGER;
