import { prisma } from "@/lib/prisma";
import { awardSeasonalWatcherBadge } from "@/lib/badges";
import { awardXP } from "@/lib/xp";
import {
  getCurrentSeason,
  getSeasonKey,
  isSeasonChallengeEligible,
  isValidSeason,
  type Season,
} from "@/lib/season";
import { SEASON_CHALLENGE_TARGET } from "@/lib/season-challenge-types";

export interface SeasonChallengeStart {
  season: Season;
  year: number;
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
      anime: {
        season,
        seasonYear: year,
        type: "ANIME",
      },
    },
  });
}

/**
 * Recompute season challenge progress from COMPLETED tracker entries.
 * Option A: once earned, badge/XP/completed flag are never revoked.
 */
export async function syncSeasonChallenge(
  userId: string,
  media: { season?: string | null; seasonYear?: number | null }
): Promise<void> {
  if (!media.season || media.seasonYear == null || !isValidSeason(media.season)) {
    return;
  }

  const from = await getSeasonChallengeStart(userId);
  if (!from) return;

  const season = media.season;
  const year = media.seasonYear;
  if (!isSeasonChallengeEligible(season, year, from)) return;

  const key = getSeasonKey(season, year);
  const count = await countCompletedForSeasonChallenge(userId, season, year, from);

  const existing = await prisma.seasonalProgress.findUnique({
    where: { userId_season: { userId, season: key } },
  });

  const wasCompleted = existing?.completed ?? false;
  const nowCompleted = wasCompleted || count >= SEASON_CHALLENGE_TARGET;

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

  if (count >= SEASON_CHALLENGE_TARGET && !wasCompleted) {
    await awardXP(userId, "SEASON_CHALLENGE", {
      meta: { season: key },
    });
    await awardSeasonalWatcherBadge(userId, key);
  }
}
