import { formatSeasonLabel } from "@/lib/season";
import type { SeasonChallengeData } from "@/lib/season-challenge-types";

export const SEASON_CHALLENGE_SYNC_EVENT = "mirubox:season-challenge-sync";
export const SEASON_CHALLENGE_OPEN_EVENT = "mirubox:season-challenge-open";

export interface SeasonChallengeSyncDetail {
  justEarned?: boolean;
  challenge?: ContinueStripSeasonChallenge;
}

export interface ContinueStripSeasonChallenge {
  emoji: string;
  label: string;
  season: string;
  year: number;
  target: number;
  count: number;
  isEarned: boolean;
  badgeLabel: string;
  xpReward: number;
  completedTitles: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
  }[];
  suggestions: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    averageScore: number | null;
  }[];
}

export function toContinueStripSeasonChallenge(
  data: SeasonChallengeData
): ContinueStripSeasonChallenge {
  return {
    emoji: data.emoji,
    label: `${formatSeasonLabel(data.season)} ${data.year}`,
    season: data.season,
    year: data.year,
    target: data.target,
    count: data.count,
    isEarned: data.isEarned,
    badgeLabel: data.badgeLabel,
    xpReward: data.xpReward,
    completedTitles: data.completedTitles.map((entry) => ({
      id: entry.anime.id,
      title: entry.anime.title,
      titleEnglish: entry.anime.titleEnglish,
      coverImage: entry.anime.coverImage,
    })),
    suggestions: data.suggestions,
  };
}

export function notifySeasonChallengeSync(
  detail?: SeasonChallengeSyncDetail
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SEASON_CHALLENGE_SYNC_EVENT, { detail: detail ?? {} })
  );
}

export function openSeasonChallengeModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SEASON_CHALLENGE_OPEN_EVENT));
}

export async function fetchContinueStripSeasonChallenge(): Promise<ContinueStripSeasonChallenge | null> {
  const res = await fetch("/api/season-challenge");
  if (!res.ok) return null;
  return (await res.json()) as ContinueStripSeasonChallenge | null;
}
