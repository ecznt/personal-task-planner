CREATE TYPE "AccountLifecycleState" AS ENUM ('ACTIVE', 'DELETION_CONFIRMED');
CREATE TYPE "OnboardingState" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "IdentityVerificationState" AS ENUM ('PENDING', 'ACTIVE');
CREATE TYPE "AuthAbuseAction" AS ENUM ('REGISTRATION');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "normalizedPrimaryEmail" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "inAppReminderNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "onboardingState" "OnboardingState" NOT NULL DEFAULT 'PENDING',
    "accountLifecycleState" "AccountLifecycleState" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "authentication_identities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "verificationState" "IdentityVerificationState" NOT NULL DEFAULT 'PENDING',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "lastAuthenticatedAt" TIMESTAMPTZ(3),
    "disabledAt" TIMESTAMPTZ(3),
    "disabledReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "authentication_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_verification_challenges" (
    "id" UUID NOT NULL,
    "authenticationIdentityId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "anonymous_auth_transactions" (
    "id" UUID NOT NULL,
    "browserTokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_auth_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_abuse_counters" (
    "id" BIGSERIAL NOT NULL,
    "action" "AuthAbuseAction" NOT NULL,
    "keyHash" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_abuse_counters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_normalized_primary_email_key" ON "users"("normalizedPrimaryEmail");
CREATE UNIQUE INDEX "authentication_identity_user_id_key" ON "authentication_identities"("userId");
CREATE UNIQUE INDEX "authentication_identity_normalized_email_key" ON "authentication_identities"("normalizedEmail");
CREATE UNIQUE INDEX "email_verification_challenge_token_hash_key" ON "email_verification_challenges"("tokenHash");
CREATE INDEX "email_verification_challenge_identity_expiry_idx" ON "email_verification_challenges"("authenticationIdentityId", "expiresAt");
CREATE UNIQUE INDEX "anonymous_auth_transaction_browser_token_hash_key" ON "anonymous_auth_transactions"("browserTokenHash");
CREATE INDEX "anonymous_auth_transaction_expiry_idx" ON "anonymous_auth_transactions"("expiresAt");
CREATE UNIQUE INDEX "auth_abuse_counter_window_key" ON "auth_abuse_counters"("action", "keyHash", "windowStartedAt");
CREATE INDEX "auth_abuse_counter_expiry_idx" ON "auth_abuse_counters"("expiresAt");

ALTER TABLE "authentication_identities"
ADD CONSTRAINT "authentication_identities_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_verification_challenges"
ADD CONSTRAINT "email_verification_challenges_authenticationIdentityId_fkey"
FOREIGN KEY ("authenticationIdentityId") REFERENCES "authentication_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
