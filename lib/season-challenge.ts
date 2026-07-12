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
  countCompletedForSeasonChallenge,
  getSeasonChallengeStart,
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

async function getSeasonChallengeEarnedAt(
  userId: string,
  key: string
): Promise<Date | null> {
  const tx = await prisma.xPTransaction.findFirst({
    where: {
      userId,
      action: "SEASON_CHALLENGE",
      meta: { path: ["season"], equals: key },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return tx?.createdAt ?? null;
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

  const count = await countCompletedForSeasonChallenge(
    userId,
    season,
    year,
    from
  );

  const [progress, completedEntries, suggestions, earnedAt] =
    await Promise.all([
      prisma.seasonalProgress.findUnique({
        where: { userId_season: { userId, season: key } },
      }),
      prisma.trackerEntry.findMany({
        where: {
          userId,
          status: "COMPLETED",
          mediaType: "ANIME",
          anime: {
            season,
            seasonYear: year,
            type: "ANIME",
          },
        },
        include: {
          anime: {
            select: {
              id: true,
              title: true,
              titleEnglish: true,
              coverImage: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: SEASON_CHALLENGE_TARGET,
      }),
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
      getSeasonChallengeEarnedAt(userId, key),
    ]);

  const completedIds = new Set(completedEntries.map((e) => e.animeId));
  const filteredSuggestions = suggestions
    .filter((s) => !completedIds.has(s.id))
    .slice(0, SEASON_CHALLENGE_SUGGESTIONS);

  const isEarned = progress?.completed ?? false;
  const resolvedCount = Math.max(count, progress?.count ?? 0);
  const resolvedEarnedAt = earnedAt;
  const daysSinceEarned =
    resolvedEarnedAt != null ? daysSince(resolvedEarnedAt) : null;
  const showOnHome =
    !isEarned ||
    resolvedEarnedAt == null ||
    (daysSinceEarned != null && daysSinceEarned < 7);

  return {
    season,
    year,
    label,
    emoji,
    key,
    target: SEASON_CHALLENGE_TARGET,
    count: resolvedCount,
    isEarned,
    earnedAt: resolvedEarnedAt,
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
