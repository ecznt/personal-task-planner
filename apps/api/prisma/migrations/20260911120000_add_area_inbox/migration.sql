-- Add Inbox concept: a per-user default area flagged with is_inbox.
ALTER TABLE "areas" ADD COLUMN "isInbox" BOOLEAN NOT NULL DEFAULT false;

-- Guarantee at most one inbox area per user.
CREATE UNIQUE INDEX "area_user_inbox_key" ON "areas" ("userId") WHERE "isInbox" = true;