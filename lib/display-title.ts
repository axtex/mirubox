/** Lightweight title helpers — safe to import from client components (no GraphQL). */

export function getDisplayTitle(
  title: { romaji: string | null; english: string | null; native: string | null } | null,
): string {
  if (!title) return "Unknown";
  return title.english ?? title.romaji ?? title.native ?? "Unknown";
}

/**
 * Splits off the last word of a title so it can be glued (via white-space: nowrap)
 * to a trailing inline element like a score pill — keeps that pair from ever
 * wrapping apart, so the pill is never left alone on its own line.
 */
export function splitLastWord(title: string): { leading: string; lastWord: string } {
  const idx = title.trimEnd().lastIndexOf(" ");
  if (idx === -1) return { leading: "", lastWord: title };
  return { leading: title.slice(0, idx + 1), lastWord: title.slice(idx + 1) };
}
