import { describe, expect, it } from "vitest";
import {
  CARD_TTL_FINISHED_MS,
  CARD_TTL_RELEASING_MS,
  isCatalogueCardFresh,
  isHotCatalogueStatus,
} from "@/lib/cache-utils";

describe("catalogue freshness", () => {
  it("treats releasing / upcoming / hiatus as hot", () => {
    expect(isHotCatalogueStatus("RELEASING")).toBe(true);
    expect(isHotCatalogueStatus("NOT_YET_RELEASED")).toBe(true);
    expect(isHotCatalogueStatus("HIATUS")).toBe(true);
    expect(isHotCatalogueStatus("FINISHED")).toBe(false);
    expect(isHotCatalogueStatus(null)).toBe(false);
  });

  it("uses a longer TTL for finished titles", () => {
    const almostExpiredFinished = new Date(Date.now() - CARD_TTL_FINISHED_MS + 60_000);
    const staleFinished = new Date(Date.now() - CARD_TTL_FINISHED_MS - 1);
    expect(isCatalogueCardFresh(almostExpiredFinished, "FINISHED")).toBe(true);
    expect(isCatalogueCardFresh(staleFinished, "FINISHED")).toBe(false);

    const dayOld = new Date(Date.now() - CARD_TTL_RELEASING_MS + 60_000);
    const twoDays = new Date(Date.now() - CARD_TTL_RELEASING_MS - 1);
    expect(isCatalogueCardFresh(dayOld, "RELEASING")).toBe(true);
    expect(isCatalogueCardFresh(twoDays, "RELEASING")).toBe(false);
    expect(isCatalogueCardFresh(twoDays, "FINISHED")).toBe(true);
  });

  it("treats a missing cachedAt as stale", () => {
    expect(isCatalogueCardFresh(null, "FINISHED")).toBe(false);
    expect(isCatalogueCardFresh(undefined, "RELEASING")).toBe(false);
  });
});
