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
