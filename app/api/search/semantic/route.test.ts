import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/search/semantic/route";
import { hybridSearch } from "@/lib/hybrid-search";
import { rateLimit } from "@/lib/rate-limit";

const headerState = vi.hoisted(() => ({
  forwardedFor: null as string | null,
  realIp: null as string | null,
  rateSuccess: true,
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get(name: string): string | null {
      const key = name.toLowerCase();
      if (key === "x-forwarded-for") return headerState.forwardedFor;
      if (key === "x-real-ip") return headerState.realIp;
      return null;
    },
  }),
}));

vi.mock("@/lib/hybrid-search", () => ({
  hybridSearch: vi.fn(async () => [{ id: 1, title: "Nausicaä" }]),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({
    success: headerState.rateSuccess,
    remaining: headerState.rateSuccess ? 9 : 0,
  })),
  rateLimitResponse: () =>
    Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    ),
}));

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/search/semantic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

describe("POST /api/search/semantic", () => {
  beforeEach(() => {
    headerState.forwardedFor = "203.0.113.10";
    headerState.realIp = null;
    headerState.rateSuccess = true;
    vi.mocked(hybridSearch).mockClear();
    vi.mocked(rateLimit).mockClear();
  });

  it("runs without a session and rate-limits by IP", async () => {
    const res = await post({ query: "lonely and beautiful" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ results: [{ id: 1, title: "Nausicaä" }] });
    expect(rateLimit).toHaveBeenCalledWith("semantic:203.0.113.10", 10, 60_000);
    expect(hybridSearch).toHaveBeenCalledWith("lonely and beautiful", { limit: 20 });
  });

  it("uses the first x-forwarded-for hop, trimmed", async () => {
    headerState.forwardedFor = "  1.2.3.4, 10.0.0.1";

    await post({ query: "nausicaa" });

    expect(rateLimit).toHaveBeenCalledWith("semantic:1.2.3.4", 10, 60_000);
  });

  it("falls back to x-real-ip, then unknown", async () => {
    headerState.forwardedFor = null;
    headerState.realIp = "198.51.100.2";
    await post({ query: "nausicaa" });
    expect(rateLimit).toHaveBeenCalledWith("semantic:198.51.100.2", 10, 60_000);

    headerState.realIp = null;
    vi.mocked(rateLimit).mockClear();
    await post({ query: "nausicaa" });
    expect(rateLimit).toHaveBeenCalledWith("semantic:unknown", 10, 60_000);
  });

  it("returns 429 when the IP is over the limit", async () => {
    headerState.rateSuccess = false;

    const res = await post({ query: "nausicaa" });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(hybridSearch).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON, missing query, or blank query", async () => {
    const invalid = await post("not-json");
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toEqual({ error: "Invalid JSON body" });

    const missing = await post({});
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({ error: "Query is required" });

    const blank = await post({ query: "   " });
    expect(blank.status).toBe(400);
    await expect(blank.json()).resolves.toEqual({ error: "Query is required" });
  });

  it("clips the query to 500 characters", async () => {
    const query = "a".repeat(501);
    await post({ query });
    expect(hybridSearch).toHaveBeenCalledWith("a".repeat(500), { limit: 20 });
  });

  it("clamps limit to 1–50 and defaults to 20", async () => {
    await post({ query: "nausicaa", limit: 0 });
    expect(hybridSearch).toHaveBeenLastCalledWith("nausicaa", { limit: 1 });

    await post({ query: "nausicaa", limit: 100 });
    expect(hybridSearch).toHaveBeenLastCalledWith("nausicaa", { limit: 50 });

    await post({ query: "nausicaa", limit: "nope" });
    expect(hybridSearch).toHaveBeenLastCalledWith("nausicaa", { limit: 20 });
  });
});
