export type TrackerStatus = "ALL" | "IN_PROGRESS" | "COMPLETED" | "PLANNED" | "ON_HOLD" | "DROPPED";
export type MediaType = "ALL" | "ANIME" | "MANGA";
export type SortKey = "recent" | "rating" | "title";

export interface MediaCounts {
  anime: number;
  manga: number;
  total: number;
}

export interface AnimeData {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  averageScore: number | null;
  seasonYear: number | null;
}

export interface EntryData {
  animeId: number;
  status: string;
  mediaType: string;
  progress: number;
  total: number | null;
  userScore: number | null;
  hasReview: boolean;
  updatedAt: string;
  anime: AnimeData;
  /** True when this entry is favourited but not in the tracker. */
  isFavouriteOnly?: boolean;
}

export const STATUS_TABS: { value: TrackerStatus; label: string }[] = [
  { value: "ALL",         label: "ALL" },
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED",   label: "COMPLETED" },
  { value: "PLANNED",     label: "PLANNED" },
  { value: "ON_HOLD",     label: "ON HOLD" },
  { value: "DROPPED",     label: "DROPPED" },
];

export const TYPE_TABS: { value: MediaType; label: string }[] = [
  { value: "ALL",   label: "ALL" },
  { value: "ANIME", label: "ANIME" },
  { value: "MANGA", label: "MANGA" },
];

/** @deprecated use STATUS_TABS */
export const TABS = STATUS_TABS;

export const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#3b82f6",
  COMPLETED:   "#4ade80",
  PLANNED:     "#e4e1e6",
  DROPPED:     "#e61e2a",
  ON_HOLD:     "#fbbf24",
};

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  COMPLETED:   "Completed",
  PLANNED:     "Planned",
  ON_HOLD:     "On Hold",
  DROPPED:     "Dropped",
};

export function statusToSlug(status: TrackerStatus): string {
  return status.toLowerCase().replace(/_/g, "-");
}

export function slugToStatus(slug: string): TrackerStatus {
  return slug.toUpperCase().replace(/-/g, "_") as TrackerStatus;
}

export function scoreLabel(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

/** Catalog metadata for tracker list rows (format + episode/chapter counts when known). */
export function formatEntryMetadata(entry: EntryData): string {
  const { anime, mediaType } = entry;
  const isManga = mediaType === "MANGA";
  const format = anime.format?.replace(/_/g, " ") ?? (isManga ? "MANGA" : "TV");
  const parts = [format];

  if (isManga) {
    const chapters = anime.chapters ?? entry.total;
    if (chapters != null && chapters > 0) parts.push(`${chapters} CH`);
  } else {
    const episodes = anime.episodes ?? entry.total;
    if (episodes != null && episodes > 0) parts.push(`${episodes} EP`);
  }

  return parts.join(" · ");
}
