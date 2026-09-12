import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/anilist-cache", () => ({ cacheAnimeCard: vi.fn() }));
vi.mock("@/lib/anilist-circuit", () => ({
  hydrateAniListCircuit: vi.fn(),
  shouldSkipAniList: vi.fn(),
}));
vi.mock("@/lib/anilist", () => ({
  fetchHomePageMedia: vi.fn(),
  fetchAnimeBrowseMedia: vi.fn(),
  fetchMangaBrowseMedia: vi.fn(),
  getCurrentSeason: vi.fn(),
  getNextSeason: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { shouldWriteShelfIds } from "@/lib/browse-sync";

describe("shouldWriteShelfIds", () => {
  it("writes a non-empty incoming list", () => {
    expect(shouldWriteShelfIds([1, 2], [3])).toBe(true);
    expect(shouldWriteShelfIds([], [3])).toBe(true);
  });

  it("keeps an existing populated shelf when incoming is empty", () => {
    expect(shouldWriteShelfIds([1, 2, 3], [])).toBe(false);
  });

  it("allows writing empty only when the shelf is already empty", () => {
    expect(shouldWriteShelfIds([], [])).toBe(true);
  });
});
