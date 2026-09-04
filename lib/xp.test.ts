import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { evaluateBadges } from "@/lib/badges";
import { createNotification } from "@/lib/notifications";

type LedgerRow = {
  userId: string;
  action: string;
  mediaId?: number | null;
  listId?: string | null;
  createdAt: Date;
};

const db = vi.hoisted(() => ({
  totalXP: 0,
  rank: "WATCHER",
  txs: [] as LedgerRow[],
  streak: {
    userId: "user-1",
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null as Date | null,
  },
}));

vi.mock("@/lib/prisma", () => {
  const xPTransaction = {
    findFirst: vi.fn(
      async ({
        where,
      }: {
        where: {
          userId: string;
          action: string;
          mediaId?: number;
          listId?: string;
          createdAt?: { gte: Date };
        };
      }) =>
        db.txs.find((tx) => {
          if (tx.userId !== where.userId || tx.action !== where.action) return false;
          if (where.mediaId !== undefined && tx.mediaId !== where.mediaId) return false;
          if (where.listId !== undefined && tx.listId !== where.listId) return false;
          if (where.createdAt?.gte && tx.createdAt < where.createdAt.gte) return false;
          return true;
        }) ?? null
    ),
    count: vi.fn(
      async ({
        where,
      }: {
        where: { userId: string; action: string; createdAt?: { gte: Date } };
      }) =>
        db.txs.filter((tx) => {
          if (tx.userId !== where.userId || tx.action !== where.action) return false;
          if (where.createdAt?.gte && tx.createdAt < where.createdAt.gte) return false;
          return true;
        }).length
    ),
    create: vi.fn(async ({ data }: { data: LedgerRow }) => {
      const row: LedgerRow = {
        userId: data.userId,
        action: data.action,
        mediaId: data.mediaId ?? null,
        listId: data.listId ?? null,
        createdAt: new Date(),
      };
      db.txs.push(row);
      return row;
    }),
  };

  const user = {
    update: vi.fn(
      async ({
        data,
      }: {
        data: { totalXP?: { increment: number }; rank?: string };
      }) => {
        if (data.totalXP?.increment != null) {
          db.totalXP += data.totalXP.increment;
        }
        if (data.rank != null) {
          db.rank = data.rank;
        }
        return { totalXP: db.totalXP, rank: db.rank };
      }
    ),
  };

  const userStreak = {
    upsert: vi.fn(async () => ({ ...db.streak })),
    update: vi.fn(async ({ data }: { data: Partial<typeof db.streak> }) => {
      Object.assign(db.streak, data);
      return { ...db.streak };
    }),
  };

  return {
    prisma: {
      xPTransaction,
      user,
      userStreak,
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    },
  };
});

vi.mock("@/lib/badges", () => ({
  evaluateBadges: vi.fn(async () => []),
  BADGE_DEFINITIONS: {},
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(async () => ({})),
}));

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

describe("XP_VALUES", () => {
  it("matches the shipped XP table", () => {
    expect(XP_VALUES).toEqual({
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
      BADGE_UNLOCKED: 0,
    });
  });
});

describe("awardXP", () => {
  beforeEach(() => {
    db.totalXP = 0;
    db.rank = "WATCHER";
    db.txs = [];
    db.streak = {
      userId: "user-1",
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };
    vi.mocked(evaluateBadges).mockResolvedValue([]);
    vi.mocked(createNotification).mockClear();
    vi.mocked(prisma.xPTransaction.create).mockClear();
    vi.mocked(prisma.user.update).mockClear();
  });

  it("writes a ledger row, increments total XP, and returns an XP toast", async () => {
    const result = await awardXP("user-1", "ADD_TO_TRACKER", { mediaId: 42 });

    expect(result).toMatchObject({
      awarded: 5,
      newTotal: 5,
      newRank: "WATCHER",
      rankChanged: false,
      badgesEarned: [],
    });
    expect(result?.notifications).toEqual([
      { type: "XP", title: "+5 XP", body: "Added to archive" },
    ]);
    expect(prisma.xPTransaction.create).toHaveBeenCalledOnce();
    expect(db.txs).toHaveLength(1);
  });

  it("returns null for a duplicate once-per-title complete", async () => {
    db.txs.push({
      userId: "user-1",
      action: "MARK_COMPLETED",
      mediaId: 7,
      createdAt: new Date(),
    });

    const result = await awardXP("user-1", "MARK_COMPLETED", { mediaId: 7 });

    expect(result).toBeNull();
    expect(prisma.xPTransaction.create).not.toHaveBeenCalled();
  });

  it("returns null when ADD_TO_TRACKER has already been awarded 5 times today", async () => {
    const today = startOfToday();
    for (let i = 0; i < 5; i++) {
      db.txs.push({
        userId: "user-1",
        action: "ADD_TO_TRACKER",
        mediaId: i + 1,
        createdAt: new Date(today.getTime() + i * 1000),
      });
    }

    const result = await awardXP("user-1", "ADD_TO_TRACKER", { mediaId: 99 });

    expect(result).toBeNull();
    expect(prisma.xPTransaction.create).not.toHaveBeenCalled();
  });

  it("awards ADD_TO_TRACKER when today is under the cap of 5", async () => {
    const today = startOfToday();
    for (let i = 0; i < 4; i++) {
      db.txs.push({
        userId: "user-1",
        action: "ADD_TO_TRACKER",
        mediaId: i + 1,
        createdAt: new Date(today.getTime() + i * 1000),
      });
    }

    const result = await awardXP("user-1", "ADD_TO_TRACKER", { mediaId: 99 });

    expect(result?.awarded).toBe(5);
    expect(result?.newTotal).toBe(5);
  });

  it("updates rank and notifies when total XP crosses a threshold", async () => {
    db.totalXP = 95;
    db.rank = "WATCHER";

    const result = await awardXP("user-1", "ADD_TO_TRACKER", { mediaId: 1 });

    expect(result).toMatchObject({
      awarded: 5,
      newTotal: 100,
      newRank: "TRACKER",
      rankChanged: true,
    });
    expect(result?.notifications).toEqual([
      { type: "XP", title: "+5 XP", body: "Added to archive" },
      { type: "RANK_UP", title: "You're now a TRACKER", body: "📌 TRACKER unlocked" },
    ]);
    expect(createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      type: "RANK_UP",
      title: "You're now a TRACKER",
      body: "📌 TRACKER unlocked",
    });
    expect(db.rank).toBe("TRACKER");
  });

  it("still awards when skipDuplicateCheck is set", async () => {
    db.txs.push({
      userId: "user-1",
      action: "MARK_COMPLETED",
      mediaId: 7,
      createdAt: new Date(),
    });

    const result = await awardXP("user-1", "MARK_COMPLETED", {
      mediaId: 7,
      skipDuplicateCheck: true,
    });

    expect(result?.awarded).toBe(20);
    expect(result?.notifications[0]).toEqual({
      type: "XP",
      title: "+20 XP",
      body: "Completed a series",
    });
  });

  it("returns null for a second DAILY_LOGIN on the same calendar day", async () => {
    const first = await awardXP("user-1", "DAILY_LOGIN");
    expect(first?.awarded).toBe(5);

    const second = await awardXP("user-1", "DAILY_LOGIN");
    expect(second).toBeNull();
  });
});
