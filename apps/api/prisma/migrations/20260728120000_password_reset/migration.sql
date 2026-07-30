ALTER TYPE "AuthAbuseAction" ADD VALUE 'PASSWORD_RESET_REQUEST';
ALTER TYPE "AuthAbuseAction" ADD VALUE 'PASSWORD_RESET_CONFIRMATION';

CREATE TABLE "password_reset_challenges" (
    "id" UUID NOT NULL,
    "authenticationIdentityId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "invalidatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_challenge_token_hash_key"
ON "password_reset_challenges"("tokenHash");

CREATE INDEX "password_reset_challenge_identity_expiry_idx"
ON "password_reset_challenges"("authenticationIdentityId", "expiresAt");

ALTER TABLE "password_reset_challenges"
ADD CONSTRAINT "password_reset_challenges_authenticationIdentityId_fkey"
FOREIGN KEY ("authenticationIdentityId") REFERENCES "authentication_identities"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
