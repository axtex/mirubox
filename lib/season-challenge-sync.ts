import { prisma } from "@/lib/prisma";
import { awardSeasonalWatcherBadge } from "@/lib/badges";
import { awardXP } from "@/lib/xp";
import { computeRank } from "@/lib/ranks";
import {
  getCurrentSeason,
  getSeasonBadgeKey,
  getSeasonKey,
  isSeasonChallengeEligible,
  isValidSeason,
  parseSeasonKey,
  type Season,
} from "@/lib/season";
import { SEASON_CHALLENGE_TARGET } from "@/lib/season-challenge-types";

export interface SeasonChallengeStart {
  season: Season;
  year: number;
}

/** Anime that count toward the season challenge (finished airing only). */
export function seasonChallengeAnimeFilter(season: Season, year: number) {
  return {
    season,
    seasonYear: year,
    type: "ANIME" as const,
    OR: [{ status: "FINISHED" }, { airingStatus: "FINISHED" }],
  };
}

/** Season anime shown in the challenge popup (Completed, including still-airing). */
export function seasonChallengeDisplayAnimeFilter(season: Season, year: number) {
  return {
    season,
    seasonYear: year,
    type: "ANIME" as const,
  };
}

export async function getSeasonChallengeStart(
  userId: string
): Promise<SeasonChallengeStart | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      seasonChallengeFromSeason: true,
      seasonChallengeFromYear: true,
    },
  });

  if (
    !user?.seasonChallengeFromSeason ||
    user.seasonChallengeFromYear == null ||
    !isValidSeason(user.seasonChallengeFromSeason)
  ) {
    return null;
  }

  return {
    season: user.seasonChallengeFromSeason,
    year: user.seasonChallengeFromYear,
  };
}

/** Sets the user's first eligible season to the current season on first tracker add. */
export async function initSeasonChallengeStart(
  userId: string
): Promise<SeasonChallengeStart> {
  const existing = await getSeasonChallengeStart(userId);
  if (existing) return existing;

  const { season, year } = getCurrentSeason();
  await prisma.user.update({
    where: { id: userId },
    data: {
      seasonChallengeFromSeason: season,
      seasonChallengeFromYear: year,
    },
  });

  return { season, year };
}

export async function countCompletedForSeasonChallenge(
  userId: string,
  season: Season,
  year: number,
  from: SeasonChallengeStart | null
): Promise<number> {
  if (!from || !isSeasonChallengeEligible(season, year, from)) {
    return 0;
  }

  return prisma.trackerEntry.count({
    where: {
      userId,
      status: "COMPLETED",
      mediaType: "ANIME",
      anime: seasonChallengeAnimeFilter(season, year),
    },
  });
}

/**
 * Silently revoke current-season rewards when count drops below target.
 * No toasts. Past seasons are never revoked (handled by caller).
 */
async function revokeSeasonChallengeRewards(
  userId: string,
  key: string
): Promise<void> {
  const parsed = parseSeasonKey(key);
  if (!parsed) return;

  const badgeKey = getSeasonBadgeKey(parsed.season);

  const txs = await prisma.xPTransaction.findMany({
    where: {
      userId,
      OR: [
        {
          action: "SEASON_CHALLENGE",
          meta: { path: ["season"], equals: key },
        },
        {
          action: "BADGE_UNLOCKED",
          meta: { path: ["season"], equals: key },
        },
      ],
    },
    select: { id: true, amount: true },
  });

  const clawback = txs.reduce((sum, t) => sum + t.amount, 0);

  await prisma.$transaction(async (tx) => {
    if (txs.length > 0) {
      await tx.xPTransaction.deleteMany({
        where: { id: { in: txs.map((t) => t.id) } },
      });
    }

    await tx.userBadge.deleteMany({
      where: { userId, badge: badgeKey, seasonKey: key },
    });

    if (clawback > 0) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { totalXP: true },
      });
      const nextXP = Math.max(0, (user?.totalXP ?? 0) - clawback);
      await tx.user.update({
        where: { id: userId },
        data: {
          totalXP: nextXP,
          rank: computeRank(nextXP),
        },
      });
    }
  });
}

/**
 * Recompute season challenge progress from COMPLETED + finished-airing titles.
 * Current season: completed flag tracks live count (can reset; silent clawback).
 * Past seasons: once earned, completed flag is never revoked.
 */
export async function syncSeasonChallenge(
  userId: string,
  media: { season?: string | null; seasonYear?: number | null }
): Promise<{ justEarned: boolean }> {
  if (!media.season || media.seasonYear == null || !isValidSeason(media.season)) {
    return { justEarned: false };
  }

  const from = await getSeasonChallengeStart(userId);
  if (!from) return { justEarned: false };

  const season = media.season;
  const year = media.seasonYear;
  if (!isSeasonChallengeEligible(season, year, from)) return { justEarned: false };

  const key = getSeasonKey(season, year);
  const count = await countCompletedForSeasonChallenge(userId, season, year, from);

  const existing = await prisma.seasonalProgress.findUnique({
    where: { userId_season: { userId, season: key } },
  });

  const wasCompleted = existing?.completed ?? false;
  const current = getCurrentSeason();
  const isCurrentSeason = season === current.season && year === current.year;

  // Current season tracks live progress; past seasons keep earned forever.
  const nowCompleted = isCurrentSeason
    ? count >= SEASON_CHALLENGE_TARGET
    : wasCompleted || count >= SEASON_CHALLENGE_TARGET;

  await prisma.seasonalProgress.upsert({
    where: { userId_season: { userId, season: key } },
    create: {
      userId,
      season: key,
      count,
      completed: count >= SEASON_CHALLENGE_TARGET,
    },
    update: {
      count,
      completed: nowCompleted,
    },
  });

  if (isCurrentSeason && wasCompleted && !nowCompleted) {
    await revokeSeasonChallengeRewards(userId, key);
  }

  const completedEntries = await prisma.trackerEntry.findMany({
    where: {
      userId,
      status: "COMPLETED",
      mediaType: "ANIME",
      anime: seasonChallengeAnimeFilter(season, year),
    },
    orderBy: { updatedAt: "desc" },
    take: SEASON_CHALLENGE_TARGET,
    select: { animeId: true },
  });
  const mediaIds = completedEntries.map((e) => e.animeId);

  const justEarned = count >= SEASON_CHALLENGE_TARGET && !wasCompleted && nowCompleted;

  if (justEarned) {
    await awardXP(userId, "SEASON_CHALLENGE", {
      meta: {
        season: key,
        mediaIds,
      },
    });
    await awardSeasonalWatcherBadge(userId, key);
  } else if (nowCompleted && mediaIds.length > 0) {
    // Backfill snapshotted titles for older earns that only stored { season }.
    const xpTx = await prisma.xPTransaction.findFirst({
      where: {
        userId,
        action: "SEASON_CHALLENGE",
        meta: { path: ["season"], equals: key },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, meta: true },
    });
    const meta = xpTx?.meta as { mediaIds?: unknown } | null;
    const hasIds =
      Array.isArray(meta?.mediaIds) &&
      meta.mediaIds.some((id) => typeof id === "number");
    if (xpTx && !hasIds) {
      await prisma.xPTransaction.update({
        where: { id: xpTx.id },
        data: {
          meta: { season: key, mediaIds },
        },
      });
    }
  }

  return { justEarned };
}
