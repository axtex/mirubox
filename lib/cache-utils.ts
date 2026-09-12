export function isStale(
  cachedAt: Date | null | undefined,
  ttlMs: number
): boolean {
  if (!cachedAt) return true;
  return Date.now() - cachedAt.getTime() > ttlMs;
}

export const CHARACTER_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RELATION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const STREAMING_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/** Currently airing / announced titles — episode counts and scores move. */
export const CARD_TTL_RELEASING_MS = 24 * 60 * 60 * 1000;
/** Finished catalogue almost never changes. */
export const CARD_TTL_FINISHED_MS = 14 * 24 * 60 * 60 * 1000;

export function isHotCatalogueStatus(status: string | null | undefined): boolean {
  return status === "RELEASING" || status === "NOT_YET_RELEASED" || status === "HIATUS";
}

/** Card row is fresh enough to skip AniList on the request path. */
export function isCatalogueCardFresh(
  cachedAt: Date | null | undefined,
  status: string | null | undefined,
): boolean {
  if (!cachedAt) return false;
  const ttl = isHotCatalogueStatus(status) ? CARD_TTL_RELEASING_MS : CARD_TTL_FINISHED_MS;
  return !isStale(cachedAt, ttl);
}
