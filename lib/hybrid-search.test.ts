import { describe, expect, it, vi } from "vitest";
import { mergeResults, type HybridResult } from "@/lib/hybrid-search";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/anilist", () => ({
  searchMedia: vi.fn(),
  getMediaCardsByIds: vi.fn(),
}));
vi.mock("@/lib/embeddings", () => ({
  generateEmbedding: vi.fn(),
}));

function hit(
  id: number,
  source: HybridResult["source"],
  similarity: number | null,
  title = `Title ${id}`
): HybridResult {
  return {
    id,
    title,
    titleEnglish: null,
    coverImage: null,
    genres: [],
    averageScore: null,
    format: "TV",
    type: "ANIME",
    similarity,
    source,
  };
}

describe("mergeResults", () => {
  it("keeps semantic hits and ranks them above keyword-only fills", () => {
    const merged = mergeResults(
      [hit(1, "semantic", 0.8)],
      [hit(2, "anilist", null)],
      12
    );

    expect(merged.map((r) => r.id)).toEqual([1, 2]);
    expect(merged[0]).toMatchObject({ source: "semantic", similarity: 0.8 });
    expect(merged[1]).toMatchObject({ source: "anilist", similarity: 0.5 });
  });

  it("boosts titles that appear in both lists and marks source as both", () => {
    const merged = mergeResults(
      [hit(1, "semantic", 0.8, "Nausicaä")],
      [hit(1, "anilist", null, "Nausicaä")],
      12
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: 1,
      source: "both",
      similarity: 0.9,
      title: "Nausicaä",
    });
  });

  it("sorts by similarity and respects the limit", () => {
    const merged = mergeResults(
      [hit(1, "semantic", 0.4), hit(2, "semantic", 0.9)],
      [hit(3, "anilist", null)],
      2
    );

    expect(merged.map((r) => r.id)).toEqual([2, 3]);
  });

  it("treats a missing semantic similarity as 0 before the both-list boost", () => {
    const merged = mergeResults(
      [hit(1, "semantic", null)],
      [hit(1, "anilist", null)],
      12
    );

    expect(merged[0]).toMatchObject({ source: "both", similarity: 0.1 });
  });
});
