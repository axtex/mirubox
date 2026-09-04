import { describe, expect, it, vi } from "vitest";
import { parseSimilarToQuery } from "@/lib/similar-to-search";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/anilist", () => ({
  getMediaCardsByIds: vi.fn(),
  searchMedia: vi.fn(),
}));

describe("parseSimilarToQuery", () => {
  it("extracts the reference title from similar-to phrasings", () => {
    expect(parseSimilarToQuery("similar to Nausicaa")).toBe("Nausicaa");
    expect(parseSimilarToQuery("something like Cowboy Bebop")).toBe("Cowboy Bebop");
    expect(parseSimilarToQuery("anime like Serial Experiments Lain")).toBe(
      "Serial Experiments Lain"
    );
    expect(parseSimilarToQuery("shows like Haikyuu")).toBe("Haikyuu");
    expect(parseSimilarToQuery("manga like Monster")).toBe("Monster");
    expect(parseSimilarToQuery("titles like FLCL")).toBe("FLCL");
    expect(parseSimilarToQuery("like Monster")).toBe("Monster");
  });

  it("trims padding around the query and the title", () => {
    expect(parseSimilarToQuery("  similar to  Nausicaa  ")).toBe("Nausicaa");
  });

  it("returns null when the query is not a similar-to phrase", () => {
    expect(parseSimilarToQuery("nausicaa")).toBeNull();
    expect(parseSimilarToQuery("lonely and beautiful")).toBeNull();
    expect(parseSimilarToQuery("similar to")).toBeNull();
    expect(parseSimilarToQuery("similar to    ")).toBeNull();
    expect(parseSimilarToQuery("")).toBeNull();
  });
});
