import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/tracker/route";
import { auth } from "@/auth";
import { awardXP } from "@/lib/xp";
import { prisma } from "@/lib/prisma";

type TrackerRow = {
  userId: string;
  animeId: number;
  status: string;
  mediaType: string;
  progress: number;
  total: number | null;
};

type CachedAnime = {
  id: number;
  type: "ANIME" | "MANGA";
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  season: string | null;
  seasonYear: number | null;
};

const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  existing: null as TrackerRow | null,
  cached: {
    id: 1,
    type: "ANIME",
    format: "TV",
    episodes: 12,
    chapters: null,
    season: null,
    seasonYear: null,
  } as CachedAnime,
  entryCount: 2,
  lastStatus: null as string | null,
  lastProgress: null as number | null,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () =>
    state.userId ? { user: { id: state.userId } } : null
  ),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ success: true, remaining: 29 })),
  rateLimitResponse: () =>
    Response.json({ error: "Too many requests. Please slow down." }, { status: 429 }),
}));

vi.mock("@/lib/xp", () => ({
  awardXP: vi.fn(async () => ({
    awarded: 5,
    newTotal: 5,
    newRank: "WATCHER",
    rankChanged: false,
    badgesEarned: [],
    notifications: [],
  })),
}));

vi.mock("@/lib/anilist", () => ({
  getMediaCardsByIds: vi.fn(async () => []),
}));

vi.mock("@/lib/anilist-cache", () => ({
  cacheAnimeCard: vi.fn(),
}));

vi.mock("@/lib/season-challenge", () => ({
  getSeasonChallenge: vi.fn(async () => null),
}));

vi.mock("@/lib/season-challenge-client", () => ({
  toContinueStripSeasonChallenge: vi.fn(),
}));

vi.mock("@/lib/season-challenge-sync", () => ({
  initSeasonChallengeStart: vi.fn(async () => {}),
  syncSeasonChallenge: vi.fn(async () => ({ justEarned: false })),
}));

vi.mock("@/lib/embed-on-cache", () => ({
  embedAnimeIfNeeded: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trackerEntry: {
      findUnique: vi.fn(async () => state.existing),
      count: vi.fn(async () => state.entryCount),
      upsert: vi.fn(
        async ({
          create,
          update,
        }: {
          create: { status: string; progress: number };
          update: { status: string; progress?: number };
        }) => {
          state.lastStatus = update.status;
          state.lastProgress = update.progress ?? create.progress;
          return {
            id: "entry-1",
            userId: "user-1",
            animeId: 1,
            status: update.status,
            progress: state.lastProgress,
            mediaType: "ANIME",
            total: 12,
          };
        }
      ),
      updateMany: vi.fn(),
    },
    anime: {
      findUnique: vi.fn(async () => state.cached),
    },
  },
}));

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/tracker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

function xpActions(): string[] {
  return vi.mocked(awardXP).mock.calls.map(([, action]) => action);
}

describe("POST /api/tracker", () => {
  beforeEach(() => {
    state.userId = "user-1";
    state.existing = null;
    state.entryCount = 2;
    state.lastStatus = null;
    state.lastProgress = null;
    state.cached = {
      id: 1,
      type: "ANIME",
      format: "TV",
      episodes: 12,
      chapters: null,
      season: null,
      seasonYear: null,
    };
    vi.mocked(awardXP).mockClear();
    vi.mocked(auth).mockClear();
    vi.mocked(prisma.trackerEntry.upsert).mockClear();
  });

  it("returns 401 and does not award XP when logged out", async () => {
    state.userId = null;

    const res = await post({ animeId: 1, status: "PLANNED" });

    expect(res.status).toBe(401);
    expect(awardXP).not.toHaveBeenCalled();
    expect(prisma.trackerEntry.upsert).not.toHaveBeenCalled();
  });

  it("awards ADD_TO_TRACKER when adding a new title as Planned", async () => {
    const res = await post({ animeId: 1, status: "PLANNED" });

    expect(res.status).toBe(200);
    expect(state.lastStatus).toBe("PLANNED");
    expect(xpActions()).toEqual(["ADD_TO_TRACKER"]);
    expect(awardXP).toHaveBeenCalledWith("user-1", "ADD_TO_TRACKER", { mediaId: 1 });
  });

  it("awards MARK_COMPLETED_DIRECT when adding a new title as Completed", async () => {
    const res = await post({ animeId: 1, status: "COMPLETED" });

    expect(res.status).toBe(200);
    expect(state.lastStatus).toBe("COMPLETED");
    expect(xpActions()).toEqual(["MARK_COMPLETED_DIRECT"]);
    expect(xpActions()).not.toContain("MARK_COMPLETED");
    expect(awardXP).toHaveBeenCalledWith("user-1", "MARK_COMPLETED_DIRECT", { mediaId: 1 });
  });

  it("also awards FIRST_TITLE when this is the user's first tracker entry", async () => {
    state.entryCount = 1;

    await post({ animeId: 1, status: "PLANNED" });

    expect(xpActions()).toEqual(["FIRST_TITLE", "ADD_TO_TRACKER"]);
  });

  it("awards MARK_IN_PROGRESS when Planned becomes In Progress", async () => {
    state.existing = {
      userId: "user-1",
      animeId: 1,
      status: "PLANNED",
      mediaType: "ANIME",
      progress: 0,
      total: 12,
    };

    const res = await post({ animeId: 1, status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(state.lastStatus).toBe("IN_PROGRESS");
    expect(xpActions()).toEqual(["MARK_IN_PROGRESS"]);
  });

  it("promotes Planned to In Progress when progress is set", async () => {
    state.existing = {
      userId: "user-1",
      animeId: 1,
      status: "PLANNED",
      mediaType: "ANIME",
      progress: 0,
      total: 12,
    };

    const res = await post({ animeId: 1, status: "PLANNED", progress: 1 });
    const body = (await res.json()) as { entry: { status: string; progress: number } };

    expect(body.entry.status).toBe("IN_PROGRESS");
    expect(body.entry.progress).toBe(1);
    expect(xpActions()).toEqual(["MARK_IN_PROGRESS"]);
  });

  it("awards MARK_COMPLETED when In Progress becomes Completed for a series", async () => {
    state.existing = {
      userId: "user-1",
      animeId: 1,
      status: "IN_PROGRESS",
      mediaType: "ANIME",
      progress: 11,
      total: 12,
    };

    await post({ animeId: 1, status: "COMPLETED" });

    expect(state.lastStatus).toBe("COMPLETED");
    expect(xpActions()).toEqual(["MARK_COMPLETED"]);
    expect(awardXP).toHaveBeenCalledWith("user-1", "MARK_COMPLETED", { mediaId: 1 });
  });

  it("awards COMPLETE_MOVIE_OVA when In Progress becomes Completed for a film", async () => {
    state.cached.format = "MOVIE";
    state.cached.episodes = 1;
    state.existing = {
      userId: "user-1",
      animeId: 1,
      status: "IN_PROGRESS",
      mediaType: "ANIME",
      progress: 0,
      total: 1,
    };

    await post({ animeId: 1, status: "COMPLETED" });

    expect(xpActions()).toEqual(["COMPLETE_MOVIE_OVA"]);
    expect(awardXP).toHaveBeenCalledWith("user-1", "COMPLETE_MOVIE_OVA", { mediaId: 1 });
  });

  it("marks Completed and awards MARK_COMPLETED when progress hits the full total", async () => {
    state.existing = {
      userId: "user-1",
      animeId: 1,
      status: "IN_PROGRESS",
      mediaType: "ANIME",
      progress: 11,
      total: 12,
    };

    const res = await post({ animeId: 1, status: "IN_PROGRESS", progress: 12 });
    const body = (await res.json()) as { entry: { status: string; progress: number } };

    expect(body.entry.status).toBe("COMPLETED");
    expect(body.entry.progress).toBe(12);
    expect(xpActions()).toEqual(["MARK_COMPLETED"]);
  });
});
