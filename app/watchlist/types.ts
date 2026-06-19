export type WatchlistStatus = "ALL" | "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";
export type SortKey = "recent" | "rating" | "title" | "release";

export interface AnimeData {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  format: string | null;
  episodes: number | null;
  averageScore: number | null;
  seasonYear: number | null;
}

export interface EntryData {
  animeId: number;
  status: string;
  progress: number;
  userScore: number | null;
  updatedAt: string;
  anime: AnimeData;
}

export const TABS: { value: WatchlistStatus; label: string }[] = [
  { value: "ALL",           label: "ALL" },
  { value: "WATCHING",      label: "WATCHING" },
  { value: "COMPLETED",     label: "COMPLETED" },
  { value: "PLAN_TO_WATCH", label: "PLAN TO WATCH" },
  { value: "ON_HOLD",       label: "ON HOLD" },
  { value: "DROPPED",       label: "DROPPED" },
];

export const STATUS_COLORS: Record<string, string> = {
  WATCHING:      "#3b82f6",
  COMPLETED:     "#4ade80",
  PLAN_TO_WATCH: "#e4e1e6",
  DROPPED:       "#e61e2a",
  ON_HOLD:       "#fbbf24",
};

export const STATUS_LABELS: Record<string, string> = {
  WATCHING:      "Watching",
  COMPLETED:     "Completed",
  PLAN_TO_WATCH: "Plan to Watch",
  ON_HOLD:       "On Hold",
  DROPPED:       "Dropped",
};

export function scoreLabel(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}
