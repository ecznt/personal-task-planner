-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "availableAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "account_deletion_processes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "labels" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "reauthentication_proofs" ALTER COLUMN "id" DROP DEFAULT;
