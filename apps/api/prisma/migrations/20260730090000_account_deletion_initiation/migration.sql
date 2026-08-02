ALTER TYPE "AuthAbuseAction" ADD VALUE 'REAUTHENTICATION';

CREATE TYPE "ReauthenticationAction" AS ENUM ('ACCOUNT_DELETION');

CREATE TYPE "AccountDeletionProcessState" AS ENUM ('PENDING_PRIMARY_PURGE', 'COMPLETED');

ALTER TABLE "users"
ADD COLUMN "deletionConfirmedAt" TIMESTAMPTZ(3),
ADD COLUMN "accessRevokedAt" TIMESTAMPTZ(3);

CREATE TABLE "reauthentication_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "action" "ReauthenticationAction" NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reauthentication_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reauthentication_proof_session_action_expiry_idx"
ON "reauthentication_proofs"("sessionId", "action", "expiresAt");

CREATE INDEX "reauthentication_proof_expiry_idx"
ON "reauthentication_proofs"("expiresAt");

ALTER TABLE "reauthentication_proofs"
ADD CONSTRAINT "reauthentication_proofs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reauthentication_proofs"
ADD CONSTRAINT "reauthentication_proofs_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "account_deletion_processes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "state" "AccountDeletionProcessState" NOT NULL DEFAULT 'PENDING_PRIMARY_PURGE',
    "requestedAt" TIMESTAMPTZ(3) NOT NULL,
    "accessRevokedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_processes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_deletion_process_user_state_key"
ON "account_deletion_processes"("userId", "state");

CREATE INDEX "account_deletion_process_state_progress_idx"
ON "account_deletion_processes"("state", "updatedAt");

ALTER TABLE "account_deletion_processes"
ADD CONSTRAINT "account_deletion_processes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
