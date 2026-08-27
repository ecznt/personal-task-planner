-- CreateTable
CREATE TABLE "deletion_receipts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "entityKind" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "origin" TEXT NOT NULL,
    "purgedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deletion_receipt_user_purged_idx" ON "deletion_receipts"("userId", "purgedAt");

-- CreateIndex
CREATE INDEX "deletion_receipt_entity_idx" ON "deletion_receipts"("entityId");
