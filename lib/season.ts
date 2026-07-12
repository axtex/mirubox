import type { BadgeKey } from "@prisma/client";

export type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export const SEASON_ORDER: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

const SEASON_EMOJI: Record<Season, string> = {
  WINTER: "❄️",
  SPRING: "🌸",
  SUMMER: "☀️",
  FALL: "🍂",
};

export function getSeasonEmoji(season: Season): string {
  return SEASON_EMOJI[season];
}

export function getCurrentSeason(): {
  season: Season;
  year: number;
  label: string;
  emoji: string;
} {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  let season: Season;
  if (month >= 1 && month <= 3) {
    season = "WINTER";
  } else if (month >= 4 && month <= 6) {
    season = "SPRING";
  } else if (month >= 7 && month <= 9) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

  const emoji = getSeasonEmoji(season);

  return {
    season,
    year,
    emoji,
    label: `${season} ${year}`,
  };
}

export function getNextSeason(): { season: Season; year: number } {
  const { season, year } = getCurrentSeason();
  const idx = SEASON_ORDER.indexOf(season);
  const nextIdx = (idx + 1) % SEASON_ORDER.length;
  const nextYear = nextIdx === 0 ? year + 1 : year;
  return { season: SEASON_ORDER[nextIdx], year: nextYear };
}

export function getSeasonKey(season: string, year: number): string {
  return `${season}_${year}`;
}

export function parseSeasonKey(
  key: string
): { season: Season; year: number } | null {
  const match = key.match(/^(WINTER|SPRING|SUMMER|FALL)_(\d+)$/);
  if (!match) return null;
  return {
    season: match[1] as Season,
    year: Number.parseInt(match[2], 10),
  };
}

export function getSeasonOrdinal(season: Season, year: number): number {
  return year * SEASON_ORDER.length + SEASON_ORDER.indexOf(season);
}

export function isSeasonChallengeEligible(
  season: Season,
  year: number,
  from: { season: Season; year: number }
): boolean {
  return getSeasonOrdinal(season, year) >= getSeasonOrdinal(from.season, from.year);
}

export function isValidSeason(value: string): value is Season {
  return SEASON_ORDER.includes(value as Season);
}

export function getSeasonBadgeKey(season: Season): BadgeKey {
  return `${season}_WATCHER` as BadgeKey;
}

export function formatSeasonLabel(season: string): string {
  return season[0].toUpperCase() + season.slice(1).toLowerCase();
}

export const SEASONAL_WATCHER_BADGES: BadgeKey[] = [
  "SPRING_WATCHER",
  "SUMMER_WATCHER",
  "FALL_WATCHER",
  "WINTER_WATCHER",
];

export function isSeasonalWatcherBadge(badge: BadgeKey): boolean {
  return SEASONAL_WATCHER_BADGES.includes(badge);
}

export function formatSeasonBadgeLabel(seasonKey: string): string {
  const parsed = parseSeasonKey(seasonKey);
  if (!parsed) return "Season Watcher";
  return `${formatSeasonLabel(parsed.season)} ${parsed.year} Watcher`;
}

export function getSeasonBrowseSearchHref(season: Season | string, year: number): string {
  return `/search?type=anime&season=${season.toLowerCase()}&year=${year}&mode=browse`;
}
