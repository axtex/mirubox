export interface MalEntry {
  malId: number;
  status: string;
  progress: number;
  score: number;
  title: string;
  type: "anime" | "manga";
}

export interface ImportResult {
  imported: number;
  skipped: number;
  notFound: number;
  animeImported: number;
  mangaImported: number;
}

/** AniList MediaList status → mirubox status */
export function mapAnilistStatus(status: string): string {
  const map: Record<string, string> = {
    CURRENT: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    PLANNING: "PLANNED",
    DROPPED: "DROPPED",
    PAUSED: "ON_HOLD",
    REPEATING: "COMPLETED",
  };
  return map[status] ?? "PLANNED";
}

/** MAL export my_status → mirubox status */
export function mapMalStatus(status: string): string {
  const map: Record<string, string> = {
    Watching: "IN_PROGRESS",
    Reading: "IN_PROGRESS",
    Completed: "COMPLETED",
    "Plan to Watch": "PLANNED",
    "Plan to Read": "PLANNED",
    "On-Hold": "ON_HOLD",
    Dropped: "DROPPED",
    // Numeric MAL export formats
    "1": "IN_PROGRESS",
    "2": "COMPLETED",
    "3": "ON_HOLD",
    "4": "DROPPED",
    "6": "PLANNED",
  };
  return map[status] ?? "PLANNED";
}

/**
 * Map a 1–10 user score. 0 / null / undefined = unrated.
 * AniList list scores are often 0–100 — normalize those before clamping.
 */
export function mapScore(score: number | null | undefined): number | null {
  if (score == null || score === 0) return null;
  let normalized = score;
  if (normalized > 10) normalized = normalized / 10;
  return Math.min(10, Math.max(1, Math.round(normalized)));
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m?.[1]?.trim() ?? "";
}

function extractCdataOrText(raw: string): string {
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return (cdata?.[1] ?? raw).trim();
}

/** Parse a MAL anime/manga list XML export (no extra XML dependency). */
export function parseMalXml(xmlText: string, type: "anime" | "manga"): MalEntry[] {
  const tag = type === "anime" ? "anime" : "manga";
  const idTag = type === "anime" ? "series_animedb_id" : "series_mangadb_id";
  const progressTag = type === "anime" ? "my_watched_episodes" : "my_read_chapters";
  const blocks = xmlText.match(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, "gi")) ?? [];

  const entries: MalEntry[] = [];
  for (const block of blocks) {
    const malId = Number(extractTag(block, idTag));
    if (!Number.isFinite(malId) || malId <= 0) continue;

    const statusRaw = extractCdataOrText(extractTag(block, "my_status"));
    const progress = Number(extractTag(block, progressTag)) || 0;
    const score = Number(extractTag(block, "my_score")) || 0;
    const title = extractCdataOrText(extractTag(block, "series_title")) || `MAL #${malId}`;

    entries.push({
      malId,
      status: statusRaw,
      progress: Math.max(0, Math.floor(progress)),
      score,
      title,
      type,
    });
  }
  return entries;
}

export function daysAgoLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function isValidAnilistUsername(username: string): boolean {
  return /^[A-Za-z0-9_-]{2,20}$/.test(username);
}
