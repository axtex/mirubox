import { describe, expect, it, vi } from "vitest";
import { resolveDescriptor } from "@/lib/descriptor-search";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/anilist", () => ({ searchMedia: vi.fn() }));

describe("resolveDescriptor", () => {
  it("maps a single mood word to AniList filters and a semantic phrase", () => {
    expect(resolveDescriptor("sad")).toEqual({
      genres: ["Drama"],
      semanticQuery: "sad melancholic emotional heartbreaking tragic anime",
    });
    expect(resolveDescriptor("  SAD  ")?.genres).toEqual(["Drama"]);
  });

  it("accepts hyphenated sci-fi and LGBTQ tags", () => {
    expect(resolveDescriptor("sci-fi")?.genres).toEqual(["Sci-Fi"]);
    expect(resolveDescriptor("scifi")?.genres).toEqual(["Sci-Fi"]);
    expect(resolveDescriptor("bl")?.tags).toEqual(["Boys Love"]);
    expect(resolveDescriptor("yuri")?.tags).toEqual(["Yuri", "Girls Love"]);
  });

  it("allows thematic words without genres", () => {
    expect(resolveDescriptor("cars")).toEqual({
      semanticQuery: "racing cars driving motorsport street racing anime",
    });
  });

  it("returns null for empty, multi-word, or unknown queries", () => {
    expect(resolveDescriptor("")).toBeNull();
    expect(resolveDescriptor("   ")).toBeNull();
    expect(resolveDescriptor("something lonely")).toBeNull();
    expect(resolveDescriptor("nausicaa")).toBeNull();
    expect(resolveDescriptor("slice of life")).toBeNull();
  });
});
