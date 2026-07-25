ALTER TYPE "AuthAbuseAction" ADD VALUE 'EMAIL_VERIFICATION_REQUEST';
ALTER TYPE "AuthAbuseAction" ADD VALUE 'EMAIL_VERIFICATION_CONFIRMATION';

CREATE TYPE "IdempotencyState" AS ENUM ('PROCESSING', 'COMPLETED');

ALTER TABLE "authentication_identities"
ADD COLUMN "verifiedAt" TIMESTAMPTZ(3);

ALTER TABLE "email_verification_challenges"
ADD COLUMN "invalidatedAt" TIMESTAMPTZ(3);

CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "keyHash" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "state" "IdempotencyState" NOT NULL DEFAULT 'PROCESSING',
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_record_key_hash_key"
ON "idempotency_records"("keyHash");

CREATE INDEX "idempotency_record_expiry_idx"
ON "idempotency_records"("expiresAt");
