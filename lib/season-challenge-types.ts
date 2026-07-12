import type { Season } from "@/lib/season";

export const SEASON_CHALLENGE_TARGET = 3;
export const SEASON_CHALLENGE_SUGGESTIONS = 3;

export interface SeasonChallengeMedia {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
}

export interface SeasonChallengeCompletedTitle {
  animeId: number;
  anime: SeasonChallengeMedia;
}

export interface SeasonChallengeData {
  season: Season;
  year: number;
  label: string;
  emoji: string;
  key: string;
  target: number;
  count: number;
  isEarned: boolean;
  earnedAt: Date | null;
  completedTitles: SeasonChallengeCompletedTitle[];
  suggestions: Array<SeasonChallengeMedia & { averageScore: number | null }>;
  xpReward: number;
  badgeLabel: string;
  showOnHome: boolean;
}

export interface PastSeasonChallenge {
  season: Season;
  year: number;
  label: string;
  emoji: string;
  badgeLabel: string;
  earnedAt: Date;
}

export function formatEarnedDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
