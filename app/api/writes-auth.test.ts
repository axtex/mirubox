import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as postList } from "@/app/api/lists/route";
import { POST as postReview } from "@/app/api/reviews/route";
import { POST as postRating } from "@/app/api/ratings/route";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { rateLimit } from "@/lib/rate-limit";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
}));

vi.mock("@/lib/xp", () => ({
  awardXP: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  rateLimitResponse: () =>
    Response.json({ error: "Too many requests. Please slow down." }, { status: 429 }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    list: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    rating: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    anime: {
      findUnique: vi.fn(),
    },
  },
}));

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("mutating APIs require a session", () => {
  beforeEach(() => {
    vi.mocked(awardXP).mockClear();
    vi.mocked(rateLimit).mockClear();
    vi.mocked(prisma.list.create).mockClear();
    vi.mocked(prisma.review.upsert).mockClear();
    vi.mocked(prisma.rating.upsert).mockClear();
  });

  it("POST /api/lists returns 401 and does not write", async () => {
    const res = await postList(
      jsonRequest("http://localhost/api/lists", {
        title: "Best films",
        entries: [{ mediaId: 1, mediaType: "ANIME" }],
      })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(prisma.list.create).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
  });

  it("POST /api/reviews returns 401 and does not write", async () => {
    const res = await postReview(
      jsonRequest("http://localhost/api/reviews", {
        animeId: 1,
        content: "A review.",
      })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(prisma.review.upsert).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
  });

  it("POST /api/ratings returns 401 and does not write", async () => {
    const res = await postRating(
      jsonRequest("http://localhost/api/ratings", {
        animeId: 1,
        score: 8,
      })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
  });
});
