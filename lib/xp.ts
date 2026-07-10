import { prisma } from "@/lib/prisma";
import { XPAction, Prisma, type BadgeKey } from "@prisma/client";
import { evaluateBadges } from "@/lib/badges";

// XP values — single source of truth
export const XP_VALUES: Record<XPAction, number> = {
  ADD_TO_TRACKER: 5,
  MARK_IN_PROGRESS: 5,
  MARK_COMPLETED: 20,
  MARK_COMPLETED_DIRECT: 5,
  COMPLETE_MOVIE_OVA: 10,
  RATE_TITLE: 10,
  WRITE_REVIEW: 20,
  ADD_TO_LIST: 5,
  CREATE_LIST: 15,
  DAILY_LOGIN: 5,
  LOGIN_STREAK_7: 5,
  ADD_FRIEND: 5,
  INVITE_FRIEND: 25,
  FIRST_TITLE: 25,
  SEASON_CHALLENGE: 25,
  BADGE_UNLOCKED: 0, // varies — passed as override
};

// Rank thresholds
export const RANKS = [
  { name: "WATCHER", min: 0, emoji: "👁" },
  { name: "TRACKER", min: 100, emoji: "📌" },
  { name: "ARCHIVIST", min: 500, emoji: "📂" },
  { name: "CURATOR", min: 1000, emoji: "🎯" },
  { name: "SCHOLAR", min: 2000, emoji: "⚡" },
  { name: "SAGE", min: 3500, emoji: "🔮" },
  { name: "LEGEND", min: 5000, emoji: "👑" },
] as const;

export type RankName = (typeof RANKS)[number]["name"];

export function computeRank(totalXP: number): RankName {
  const rank = [...RANKS].reverse().find((r) => totalXP >= r.min);
  return rank?.name ?? "WATCHER";
}

export interface RankProgress {
  name: RankName;
  emoji: string;
  minXP: number;
  nextName: RankName | null;
  nextMinXP: number | null;
  progressPct: number;
  isMax: boolean;
}

export function getRankProgress(totalXP: number): RankProgress {
  const index = [...RANKS].reverse().findIndex((r) => totalXP >= r.min);
  const rankIndex = index === -1 ? 0 : RANKS.length - 1 - index;
  const current = RANKS[rankIndex] ?? RANKS[0];
  const next = RANKS[rankIndex + 1] ?? null;
  const progressPct = next
    ? Math.min(100, Math.max(0, ((totalXP - current.min) / (next.min - current.min)) * 100))
    : 100;

  return {
    name: current.name,
    emoji: current.emoji,
    minXP: current.min,
    nextName: next?.name ?? null,
    nextMinXP: next?.min ?? null,
    progressPct,
    isMax: !next,
  };
}

export interface AwardXPResult {
  awarded: number;
  newTotal: number;
  newRank: string;
  rankChanged: boolean;
  badgesEarned: BadgeKey[];
}

export interface AwardXPOptions {
  mediaId?: number;
  listId?: string;
  xpOverride?: number; // for BADGE_UNLOCKED — pass badge XP amount
  meta?: Record<string, unknown>;
  skipDuplicateCheck?: boolean;
}

// Core award function — all XP must flow through here. Never award XP directly in API routes.
export async function awardXP(
  userId: string,
  action: XPAction,
  opts: AwardXPOptions = {}
): Promise<AwardXPResult | null> {
  if (!opts.skipDuplicateCheck) {
    const isDuplicate = await checkDuplicate(userId, action, opts);
    if (isDuplicate) return null;
  }

  // Daily cap on ADD_TO_TRACKER — fair play, see /how-it-works
  if (action === "ADD_TO_TRACKER") {
    const todayCount = await countTodayActions(userId, "ADD_TO_TRACKER");
    if (todayCount >= 5) return null;
  }

  const amount = opts.xpOverride ?? XP_VALUES[action];

  const [, user] = await prisma.$transaction([
    prisma.xPTransaction.create({
      data: {
        userId,
        amount,
        action,
        mediaId: opts.mediaId,
        listId: opts.listId,
        meta: (opts.meta ?? {}) as Prisma.InputJsonObject,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalXP: { increment: amount } },
      select: { totalXP: true, rank: true },
    }),
  ]);

  const newRank = computeRank(user.totalXP);
  let rankChanged = false;

  if (newRank !== user.rank) {
    await prisma.user.update({
      where: { id: userId },
      data: { rank: newRank },
    });
    rankChanged = true;
  }

  await updateActivityStreak(userId);

  const badgesEarned = await evaluateBadges(userId);

  return {
    awarded: amount,
    newTotal: user.totalXP,
    newRank,
    rankChanged,
    badgesEarned,
  };
}

async function checkDuplicate(
  userId: string,
  action: XPAction,
  opts: { mediaId?: number; listId?: string }
): Promise<boolean> {
  const oncePerTitle: XPAction[] = [
    "MARK_IN_PROGRESS",
    "MARK_COMPLETED",
    "MARK_COMPLETED_DIRECT",
    "COMPLETE_MOVIE_OVA",
    "RATE_TITLE",
    "WRITE_REVIEW",
  ];
  if (oncePerTitle.includes(action) && opts.mediaId) {
    const existing = await prisma.xPTransaction.findFirst({
      where: { userId, action, mediaId: opts.mediaId },
    });
    return !!existing;
  }
  if (action === "ADD_TO_LIST" && opts.mediaId && opts.listId) {
    const existing = await prisma.xPTransaction.findFirst({
      where: { userId, action, mediaId: opts.mediaId, listId: opts.listId },
    });
    return !!existing;
  }
  if (action === "FIRST_TITLE") {
    const existing = await prisma.xPTransaction.findFirst({
      where: { userId, action },
    });
    return !!existing;
  }
  if (action === "DAILY_LOGIN") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.xPTransaction.findFirst({
      where: { userId, action, createdAt: { gte: today } },
    });
    return !!existing;
  }
  return false;
}

async function countTodayActions(userId: string, action: XPAction): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.xPTransaction.count({
    where: { userId, action, createdAt: { gte: today } },
  });
}

// A streak day = any XP-earning action other than DAILY_LOGIN
async function updateActivityStreak(userId: string): Promise<void> {
  const streak = await prisma.userStreak.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastDate = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  const isToday = lastDate?.getTime() === today.getTime();
  if (isToday) return;

  const isYesterday = lastDate?.getTime() === yesterday.getTime();
  const newStreak = isYesterday ? streak.currentStreak + 1 : 1;

  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivityDate: today,
    },
  });
}

// Seasonal challenge — 3 titles added/completed from a season earns that season's badge XP
export async function checkAndAwardSeasonChallenge(
  userId: string,
  media: { season?: string | null; seasonYear?: number | null }
): Promise<void> {
  if (!media.season || !media.seasonYear) return;

  const key = `${media.season}_${media.seasonYear}`;

  const progress = await prisma.seasonalProgress.upsert({
    where: { userId_season: { userId, season: key } },
    create: { userId, season: key, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (progress.count === 3 && !progress.completed) {
    await prisma.seasonalProgress.update({
      where: { userId_season: { userId, season: key } },
      data: { completed: true },
    });
    await awardXP(userId, "SEASON_CHALLENGE", {
      meta: { season: key },
    });
  }
}
