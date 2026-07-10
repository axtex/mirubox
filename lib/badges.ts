import { prisma } from "@/lib/prisma";
import { BadgeKey } from "@prisma/client";
import { awardXP } from "@/lib/xp";

export const BADGE_DEFINITIONS: Record<
  BadgeKey,
  {
    name: string;
    xp: number;
    check: (userId: string) => Promise<boolean>;
  }
> = {
  // COMPLETION
  FIRST_FINISH: { name: "First Finish", xp: 50, check: async (uid) => (await countCompleted(uid)) >= 1 },
  SERIES_BINGER: { name: "Series Binger", xp: 75, check: async (uid) => (await countCompleted(uid)) >= 10 },
  COMPLETIONIST: { name: "Completionist", xp: 150, check: async (uid) => (await countCompleted(uid)) >= 50 },
  CENTENARIAN: { name: "Centenarian", xp: 300, check: async (uid) => (await countCompleted(uid)) >= 100 },
  CINEPHILE: { name: "Cinephile", xp: 100, check: async (uid) => (await countCompletedByFormat(uid, ["MOVIE"])) >= 10 },
  COMPLETIONIST_PLUS: { name: "Completionist+", xp: 300, check: async () => hasCompletedFranchise() },

  // DEMOGRAPHIC ENTHUSIAST
  SHONEN_ENTHUSIAST: { name: "Shonen Enthusiast", xp: 100, check: async (uid) => (await countByDemographic(uid, "SHOUNEN")) >= 10 },
  SHOJO_ENTHUSIAST: { name: "Shojo Enthusiast", xp: 100, check: async (uid) => (await countByDemographic(uid, "SHOUJO")) >= 10 },
  SEINEN_ENTHUSIAST: { name: "Seinen Enthusiast", xp: 100, check: async (uid) => (await countByDemographic(uid, "SEINEN")) >= 10 },
  JOSEI_ENTHUSIAST: { name: "Josei Enthusiast", xp: 100, check: async (uid) => (await countByDemographic(uid, "JOSEI")) >= 10 },

  // DEMOGRAPHIC VETERAN
  SHONEN_VETERAN: { name: "Shonen Veteran", xp: 200, check: async (uid) => (await countByDemographic(uid, "SHOUNEN")) >= 30 },
  SHOJO_VETERAN: { name: "Shojo Veteran", xp: 200, check: async (uid) => (await countByDemographic(uid, "SHOUJO")) >= 30 },
  SEINEN_VETERAN: { name: "Seinen Veteran", xp: 200, check: async (uid) => (await countByDemographic(uid, "SEINEN")) >= 30 },
  JOSEI_VETERAN: { name: "Josei Veteran", xp: 200, check: async (uid) => (await countByDemographic(uid, "JOSEI")) >= 30 },

  // GENRE MASTERY
  MIND_BENT: { name: "Mind Bent", xp: 100, check: async (uid) => (await countByGenre(uid, "Psychological")) >= 10 },
  SLICE_OF_LIFER: { name: "Slice of Lifer", xp: 100, check: async (uid) => (await countByGenre(uid, "Slice of Life")) >= 10 },
  THE_ROMANTIC: { name: "The Romantic", xp: 100, check: async (uid) => (await countByGenre(uid, "Romance")) >= 10 },
  HORROR_HEAD: { name: "Horror Head", xp: 100, check: async (uid) => (await countByGenre(uid, "Horror")) >= 10 },
  SCI_FI_FAN: { name: "Sci-Fi Fan", xp: 100, check: async (uid) => (await countByGenre(uid, "Sci-Fi")) >= 10 },
  FANTASY_DWELLER: { name: "Fantasy Dweller", xp: 100, check: async (uid) => (await countByGenre(uid, "Fantasy")) >= 10 },

  // MANGA
  READER: { name: "Reader", xp: 75, check: async (uid) => (await countCompletedManga(uid)) >= 5 },
  BOOKWORM: { name: "Bookworm", xp: 150, check: async (uid) => (await countCompletedManga(uid)) >= 20 },
  STACKER: { name: "Stacker", xp: 250, check: async (uid) => (await countCompletedManga(uid)) >= 50 },
  ONE_AND_DONE: { name: "One and Done", xp: 100, check: async (uid) => (await countCompletedByFormat(uid, ["ONE_SHOT"])) >= 10 },
  READ_BEFORE_WATCH: { name: "Read Before Watch", xp: 200, check: async () => hasReadBeforeWatch() },
  ORIGIN_SEEKER: { name: "Origin Seeker", xp: 150, check: async (uid) => (await countMangaWithAnimeAdaptation(uid)) >= 5 },
  UP_TO_DATE: { name: "Up to Date", xp: 75, check: async (uid) => hasCompletedPublishingManga(uid) },

  // CRITIC
  FIRST_TAKE: { name: "First Take", xp: 50, check: async (uid) => (await countReviews(uid)) >= 1 },
  CRITIC: { name: "Critic", xp: 100, check: async (uid) => (await countReviews(uid)) >= 10 },
  STAFF_WRITER: { name: "Staff Writer", xp: 200, check: async (uid) => (await countReviews(uid)) >= 25 },
  BIG_RATER: { name: "Big Rater", xp: 75, check: async (uid) => (await countRatings(uid)) >= 50 },
  DISCERNING: { name: "Discerning", xp: 150, check: async (uid) => (await countRatings(uid)) >= 100 },

  // STREAK
  ON_A_ROLL: { name: "On a Roll", xp: 20, check: async (uid) => (await getStreak(uid, "current")) >= 7 },
  COMMITTED: { name: "Committed", xp: 50, check: async (uid) => (await getStreak(uid, "longest")) >= 30 },
  DEVOTED: { name: "Devoted", xp: 100, check: async (uid) => (await getStreak(uid, "longest")) >= 100 },

  // SEASONAL
  SPRING_WATCHER: { name: "Spring Watcher", xp: 25, check: async (uid) => checkSeasonalBadge(uid, "SPRING") },
  SUMMER_WATCHER: { name: "Summer Watcher", xp: 25, check: async (uid) => checkSeasonalBadge(uid, "SUMMER") },
  FALL_WATCHER: { name: "Fall Watcher", xp: 25, check: async (uid) => checkSeasonalBadge(uid, "FALL") },
  WINTER_WATCHER: { name: "Winter Watcher", xp: 25, check: async (uid) => checkSeasonalBadge(uid, "WINTER") },
  SEASONED_WATCHER: { name: "Seasoned Watcher", xp: 100, check: async (uid) => hasConsecutiveSeasons(uid, 4) },

  // EXPLORER
  GENRE_EXPLORER: { name: "Genre Explorer", xp: 100, check: async (uid) => (await countUniqueGenres(uid)) >= 8 },
  HISTORIAN: { name: "Historian", xp: 50, check: async (uid) => hasPreY2KTitle(uid) },
  HIDDEN_GEM: { name: "Hidden Gem", xp: 250, check: async (uid) => (await countHiddenGems(uid)) >= 10 },
  ALL_ROUNDER: { name: "All-Rounder", xp: 100, check: async (uid) => hasAllFormats(uid) },

  // SOCIAL — placeholders until the community feature ships (see countInvited/hasListWith10Likes)
  RECRUITER: { name: "Recruiter", xp: 25, check: async () => (await countInvited()) >= 1 },
  AMBASSADOR: { name: "Ambassador", xp: 100, check: async () => (await countInvited()) >= 5 },
  LIST_MAKER: { name: "List Maker", xp: 75, check: async (uid) => (await countPublicLists(uid)) >= 3 },
  WELL_LIKED: { name: "Well Liked", xp: 100, check: async (uid) => hasListWith10Likes(uid) },

  // PRESTIGE
  TOP_100: { name: "Top 100", xp: 500, check: async (uid) => (await countTop100Completed(uid)) >= 50 },
  PURIST: { name: "Purist", xp: 300, check: async (uid) => (await countHighScoreCompleted(uid, 9.0)) >= 20 },
  CONTRARIAN: { name: "Contrarian", xp: 150, check: async (uid) => (await countContrarian(uid)) >= 10 },
};

// Main evaluator — called after every XP award. Only checks badges the user doesn't already
// have, and is idempotent — safe to call multiple times.
export async function evaluateBadges(userId: string): Promise<BadgeKey[]> {
  const earned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badge: true },
  });
  const earnedSet = new Set(earned.map((b) => b.badge));

  const newlyEarned: BadgeKey[] = [];

  for (const [key, def] of Object.entries(BADGE_DEFINITIONS)) {
    const badgeKey = key as BadgeKey;
    if (earnedSet.has(badgeKey)) continue;

    const qualifies = await def.check(userId);
    if (!qualifies) continue;

    await prisma.userBadge.create({
      data: { userId, badge: badgeKey, xpAwarded: def.xp },
    });

    if (def.xp > 0) {
      await awardXP(userId, "BADGE_UNLOCKED", {
        xpOverride: def.xp,
        skipDuplicateCheck: true,
        meta: { badge: badgeKey },
      });
    }

    newlyEarned.push(badgeKey);
  }

  return newlyEarned;
}

// ─── Helper query functions ────────────────────────────────────────────────

async function countCompleted(userId: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { type: "ANIME" } },
  });
}

async function countCompletedManga(userId: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { type: "MANGA" } },
  });
}

async function countCompletedByFormat(userId: string, formats: string[]): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { format: { in: formats } } },
  });
}

async function countByGenre(userId: string, genre: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { genres: { has: genre } } },
  });
}

async function countByDemographic(userId: string, demographic: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { demographic } },
  });
}

async function countReviews(userId: string): Promise<number> {
  return prisma.review.count({ where: { userId } });
}

async function countRatings(userId: string): Promise<number> {
  return prisma.rating.count({ where: { userId } });
}

async function getStreak(userId: string, type: "current" | "longest"): Promise<number> {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) return 0;
  return type === "current" ? streak.currentStreak : streak.longestStreak;
}

async function countUniqueGenres(userId: string): Promise<number> {
  const entries = await prisma.trackerEntry.findMany({
    where: { userId, status: "COMPLETED" },
    include: { anime: { select: { genres: true } } },
  });
  const genres = new Set(entries.flatMap((e) => e.anime?.genres ?? []));
  return genres.size;
}

// No `startDate` field is cached from AniList — seasonYear is used as the pre-Y2K signal instead.
async function hasPreY2KTitle(userId: string): Promise<boolean> {
  const entry = await prisma.trackerEntry.findFirst({
    where: { userId, status: "COMPLETED", anime: { seasonYear: { lt: 2000 } } },
  });
  return !!entry;
}

async function countHiddenGems(userId: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { popularity: { lt: 10000 } } },
  });
}

async function hasAllFormats(userId: string): Promise<boolean> {
  const formats = ["TV", "MANGA", "MOVIE", "OVA"];
  for (const format of formats) {
    const entry = await prisma.trackerEntry.findFirst({
      where: { userId, status: "COMPLETED", anime: { format } },
    });
    if (!entry) return false;
  }
  return true;
}

// Deferred — requires matching a manga to its anime adaptation by relation, not just a flag.
// Left as a future enhancement; always false until that cross-reference is built.
async function hasReadBeforeWatch(): Promise<boolean> {
  return false;
}

// Deferred — requires walking AniList SEQUEL/PREQUEL relation chains per franchise.
// Left as a future enhancement; always false until that graph walk is built.
async function hasCompletedFranchise(): Promise<boolean> {
  return false;
}

async function countMangaWithAnimeAdaptation(userId: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { type: "MANGA", hasAnimeAdaptation: true } },
  });
}

async function hasCompletedPublishingManga(userId: string): Promise<boolean> {
  const entry = await prisma.trackerEntry.findFirst({
    where: { userId, status: "COMPLETED", anime: { type: "MANGA", status: "RELEASING" } },
  });
  return !!entry;
}

async function checkSeasonalBadge(userId: string, season: string): Promise<boolean> {
  const currentYear = new Date().getFullYear();
  const key = `${season}_${currentYear}`;
  const progress = await prisma.seasonalProgress.findUnique({
    where: { userId_season: { userId, season: key } },
  });
  return progress?.completed ?? false;
}

async function hasConsecutiveSeasons(userId: string, count: number): Promise<boolean> {
  const earnedBadges = await prisma.userBadge.findMany({
    where: {
      userId,
      badge: { in: ["SPRING_WATCHER", "SUMMER_WATCHER", "FALL_WATCHER", "WINTER_WATCHER"] },
    },
    orderBy: { earnedAt: "asc" },
  });
  return earnedBadges.length >= count;
}

async function countPublicLists(userId: string): Promise<number> {
  return prisma.list.count({
    where: { userId, isPublic: true, entries: { some: {} } },
  });
}

async function hasListWith10Likes(userId: string): Promise<boolean> {
  const list = await prisma.list.findFirst({
    where: { userId },
    orderBy: { likes: { _count: "desc" } },
    include: { _count: { select: { likes: true } } },
  });
  return (list?._count.likes ?? 0) >= 10;
}

// Deferred — requires a referral system, built alongside the community feature.
async function countInvited(): Promise<number> {
  return 0;
}

async function countTop100Completed(userId: string): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { isTop100: true } },
  });
}

async function countHighScoreCompleted(userId: string, minScore: number): Promise<number> {
  return prisma.trackerEntry.count({
    where: { userId, status: "COMPLETED", anime: { averageScore: { gte: minScore * 10 } } },
  });
}

async function countContrarian(userId: string): Promise<number> {
  const entries = await prisma.rating.findMany({
    where: { userId, anilistScoreAtRating: { not: null } },
  });
  return entries.filter((e) => {
    if (e.anilistScoreAtRating == null) return false;
    const anilistNorm = e.anilistScoreAtRating / 10;
    return Math.abs(e.score - anilistNorm) >= 3;
  }).length;
}
