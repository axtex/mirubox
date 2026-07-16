import { prisma } from "@/lib/prisma";
import { XP_VALUES } from "@/lib/xp";
import {
  formatSeasonBadgeLabel,
  getCurrentSeason,
  getSeasonEmoji,
  getSeasonKey,
  isSeasonChallengeEligible,
  parseSeasonKey,
} from "@/lib/season";
import {
  getSeasonChallengeStart,
  seasonChallengeDisplayAnimeFilter,
} from "@/lib/season-challenge-sync";
import {
  SEASON_CHALLENGE_SUGGESTIONS,
  SEASON_CHALLENGE_TARGET,
  type PastSeasonChallenge,
  type SeasonChallengeData,
} from "@/lib/season-challenge-types";

export {
  SEASON_CHALLENGE_SUGGESTIONS,
  SEASON_CHALLENGE_TARGET,
  formatEarnedDate,
  type PastSeasonChallenge,
  type SeasonChallengeData,
  type SeasonChallengeMedia,
  type SeasonChallengeCompletedTitle,
} from "@/lib/season-challenge-types";

function daysSince(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

async function getSeasonChallengeEarnedMeta(
  userId: string,
  key: string,
): Promise<{ id: string; earnedAt: Date; mediaIds: number[] } | null> {
  const tx = await prisma.xPTransaction.findFirst({
    where: {
      userId,
      action: "SEASON_CHALLENGE",
      meta: { path: ["season"], equals: key },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, meta: true },
  });
  if (!tx) return null;

  const meta = tx.meta as { season?: string; mediaIds?: unknown } | null;
  const mediaIds = Array.isArray(meta?.mediaIds)
    ? meta.mediaIds.filter(
        (id): id is number =>
          typeof id === "number" && Number.isInteger(id) && id > 0,
      )
    : [];

  return { id: tx.id, earnedAt: tx.createdAt, mediaIds };
}

export async function getPastSeasonChallenges(
  userId: string,
  excludeKey?: string
): Promise<PastSeasonChallenge[]> {
  const transactions = await prisma.xPTransaction.findMany({
    where: {
      userId,
      action: "SEASON_CHALLENGE",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, meta: true },
  });

  const seen = new Set<string>();
  const past: PastSeasonChallenge[] = [];

  for (const tx of transactions) {
    const meta = tx.meta as { season?: string } | null;
    const key = meta?.season;
    if (!key || key === excludeKey || seen.has(key)) continue;

    const parsed = parseSeasonKey(key);
    if (!parsed) continue;

    seen.add(key);
    const { season, year } = parsed;
    past.push({
      season,
      year,
      label: `${season} ${year}`,
      emoji: getSeasonEmoji(season),
      badgeLabel: formatSeasonBadgeLabel(key),
      earnedAt: tx.createdAt,
    });
  }

  return past;
}

export async function getSeasonChallenge(
  userId: string
): Promise<SeasonChallengeData | null> {
  const { season, year, label, emoji } = getCurrentSeason();
  const key = getSeasonKey(season, year);
  const from = await getSeasonChallengeStart(userId);

  if (from && !isSeasonChallengeEligible(season, year, from)) {
    return null;
  }

  const ANIME_TITLE_SELECT = {
    id: true,
    title: true,
    titleEnglish: true,
    coverImage: true,
  } as const;

  type CompletedEntry = {
    animeId: number;
    anime: {
      id: number;
      title: string;
      titleEnglish: string | null;
      coverImage: string | null;
    };
  };

  const completedWhere = {
    userId,
    status: "COMPLETED" as const,
    mediaType: "ANIME" as const,
    // Covers + n/3 include still-airing Completed; badge/XP still require finished airing.
    anime: seasonChallengeDisplayAnimeFilter(season, year),
  };

  const [progress, earnedMeta, liveCompletedEntries, displayCount, suggestions] =
    await Promise.all([
      prisma.seasonalProgress.findUnique({
        where: { userId_season: { userId, season: key } },
      }),
      getSeasonChallengeEarnedMeta(userId, key),
      prisma.trackerEntry.findMany({
        where: completedWhere,
        include: {
          anime: { select: ANIME_TITLE_SELECT },
        },
        orderBy: { updatedAt: "desc" },
        take: SEASON_CHALLENGE_TARGET,
      }),
      prisma.trackerEntry.count({ where: completedWhere }),
      prisma.anime.findMany({
        where: {
          season,
          seasonYear: year,
          type: "ANIME",
        },
        orderBy: { popularity: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          averageScore: true,
        },
      }),
    ]);

  const isEarned = progress?.completed ?? false;
  const earnedAt = earnedMeta?.earnedAt ?? null;

  const completedEntries: CompletedEntry[] = liveCompletedEntries.map((e) => ({
    animeId: e.animeId,
    anime: e.anime,
  }));

  if (
    isEarned &&
    earnedMeta &&
    earnedMeta.mediaIds.length === 0 &&
    liveCompletedEntries.length > 0
  ) {
    void prisma.xPTransaction
      .update({
        where: { id: earnedMeta.id },
        data: {
          meta: {
            season: key,
            mediaIds: liveCompletedEntries.map((e) => e.animeId),
          },
        },
      })
      .catch(() => undefined);
  }

  const completedIds = new Set(completedEntries.map((e) => e.animeId));
  const filteredSuggestions = suggestions
    .filter((s) => !completedIds.has(s.id))
    .slice(0, SEASON_CHALLENGE_SUGGESTIONS);

  const daysSinceEarned =
    earnedAt != null ? daysSince(earnedAt) : null;
  const showOnHome =
    !isEarned ||
    earnedAt == null ||
    (daysSinceEarned != null && daysSinceEarned < 7);

  return {
    season,
    year,
    label,
    emoji,
    key,
    target: SEASON_CHALLENGE_TARGET,
    count: Math.min(displayCount, SEASON_CHALLENGE_TARGET),
    isEarned,
    earnedAt,
    completedTitles: completedEntries.map((entry) => ({
      animeId: entry.animeId,
      anime: entry.anime,
    })),
    suggestions: filteredSuggestions,
    xpReward: XP_VALUES.SEASON_CHALLENGE,
    badgeLabel: formatSeasonBadgeLabel(key),
    showOnHome,
  };
}
