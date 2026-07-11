-- Backfill seasonKey on legacy seasonal UserBadge rows from SEASON_CHALLENGE XP meta.
-- Run after adding UserBadge.seasonKey (e.g. prisma db push).
UPDATE "UserBadge" ub
SET "seasonKey" = tx.season
FROM (
  SELECT DISTINCT ON (t."userId", t.season)
    t."userId",
    t.season,
    t."createdAt"
  FROM (
    SELECT
      xt."userId",
      xt."createdAt",
      xt.meta->>'season' AS season
    FROM "XPTransaction" xt
    WHERE xt.action = 'SEASON_CHALLENGE'
      AND xt.meta->>'season' IS NOT NULL
  ) t
  ORDER BY t."userId", t.season, t."createdAt" DESC
) tx
WHERE ub."userId" = tx."userId"
  AND ub.badge IN ('SPRING_WATCHER', 'SUMMER_WATCHER', 'FALL_WATCHER', 'WINTER_WATCHER')
  AND ub."seasonKey" = ''
  AND ub.badge = (
    CASE split_part(tx.season, '_', 1)
      WHEN 'SPRING' THEN 'SPRING_WATCHER'::"BadgeKey"
      WHEN 'SUMMER' THEN 'SUMMER_WATCHER'::"BadgeKey"
      WHEN 'FALL' THEN 'FALL_WATCHER'::"BadgeKey"
      WHEN 'WINTER' THEN 'WINTER_WATCHER'::"BadgeKey"
    END
  );
