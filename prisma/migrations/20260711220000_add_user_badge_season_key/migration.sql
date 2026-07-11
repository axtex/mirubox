-- Add seasonKey to UserBadge for per-season seasonal watcher badges.
ALTER TABLE "UserBadge" ADD COLUMN IF NOT EXISTS "seasonKey" TEXT NOT NULL DEFAULT '';

-- Replace single (userId, badge) uniqueness with (userId, badge, seasonKey).
DROP INDEX IF EXISTS "UserBadge_userId_badge_key";
CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badge_seasonKey_key"
  ON "UserBadge"("userId", "badge", "seasonKey");
