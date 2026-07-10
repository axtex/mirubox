/** Soft scale for unknown totals — half-fill around a typical season / chapter batch. */
const SOFT_K = { ANIME: 12, MANGA: 20 } as const;

/**
 * Progress bar fill %. Known totals use linear progress; unknown totals use an
 * asymptotic curve so +/− still moves the bar without implying completion.
 */
export function trackerProgressPct(
  progress: number,
  total: number | null | undefined,
  mediaType: "ANIME" | "MANGA" = "ANIME",
): number {
  if (total != null && total > 0) {
    return Math.min(Math.round((progress / total) * 100), 100);
  }
  if (progress <= 0) return 0;
  const k = SOFT_K[mediaType];
  return Math.min(Math.round(100 * (1 - 1 / (1 + progress / k))), 99);
}
