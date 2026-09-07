-- Persist main studio/author so detail pages can render it from the DB cache.
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "studio" TEXT;
