import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

type RateRow = { key: string; count: number; windowStart: Date };

const store = vi.hoisted(() => ({
  rows: new Map<string, RateRow>(),
  failFind: false,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimit: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        if (store.failFind) throw new Error("db down");
        const row = store.rows.get(where.key);
        return row ? { ...row } : null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
        }: {
          where: { key: string };
          create: RateRow;
        }) => {
          store.rows.set(where.key, { ...create });
          return store.rows.get(where.key);
        }
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { key: string };
          data: { count: { increment: number } };
        }) => {
          const row = store.rows.get(where.key);
          if (!row) throw new Error("missing rate limit row");
          row.count += data.count.increment;
          return row;
        }
      ),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));

describe("rateLimit", () => {
  beforeEach(() => {
    store.rows.clear();
    store.failFind = false;
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows the first N requests and rejects N+1 in the window", async () => {
    const key = "semantic:1.2.3.4";
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(await rateLimit(key, 10, 60_000));
    }

    expect(results.every((r) => r.success)).toBe(true);
    expect(results[0]?.remaining).toBe(9);
    expect(results[9]?.remaining).toBe(0);

    const blocked = await rateLimit(key, 10, 60_000);
    expect(blocked).toEqual({ success: false, remaining: 0 });
  });

  it("resets the window when the previous window has expired", async () => {
    const key = "semantic:1.2.3.4";
    store.rows.set(key, {
      key,
      count: 10,
      windowStart: new Date(Date.now() - 61_000),
    });

    const result = await rateLimit(key, 10, 60_000);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    expect(store.rows.get(key)?.count).toBe(1);
  });

  it("fails open when Prisma throws", async () => {
    store.failFind = true;

    const result = await rateLimit("semantic:9.9.9.9", 10, 60_000);

    expect(result).toEqual({ success: true, remaining: 1 });
  });

  it("scopes counts per key", async () => {
    await rateLimit("semantic:1.2.3.4", 1, 60_000);
    const other = await rateLimit("semantic:5.6.7.8", 1, 60_000);
    const same = await rateLimit("semantic:1.2.3.4", 1, 60_000);

    expect(other.success).toBe(true);
    expect(same.success).toBe(false);
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with Retry-After", async () => {
    const res = rateLimitResponse();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    await expect(res.json()).resolves.toEqual({
      error: "Too many requests. Please slow down.",
    });
  });
});
