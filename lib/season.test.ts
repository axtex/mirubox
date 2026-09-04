import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatSeasonBadgeLabel,
  formatSeasonLabel,
  getCurrentSeason,
  getNextSeason,
  getSeasonBadgeKey,
  getSeasonBrowseSearchHref,
  getSeasonKey,
  getSeasonOrdinal,
  isSeasonChallengeEligible,
  isSeasonalWatcherBadge,
  isValidSeason,
  parseSeasonKey,
  SEASON_ORDER,
} from "@/lib/season";

describe("season calendar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps months to AniList seasons", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getCurrentSeason()).toMatchObject({
      season: "WINTER",
      year: 2026,
      label: "WINTER 2026",
    });

    vi.setSystemTime(new Date(2026, 3, 15));
    expect(getCurrentSeason().season).toBe("SPRING");

    vi.setSystemTime(new Date(2026, 6, 15));
    expect(getCurrentSeason().season).toBe("SUMMER");

    vi.setSystemTime(new Date(2026, 9, 15));
    expect(getCurrentSeason().season).toBe("FALL");
  });

  it("advances to the next season and rolls the year after Fall", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getNextSeason()).toEqual({ season: "SPRING", year: 2026 });

    vi.setSystemTime(new Date(2026, 9, 15));
    expect(getNextSeason()).toEqual({ season: "WINTER", year: 2027 });
  });
});

describe("season keys and eligibility", () => {
  it("uses WINTER, SPRING, SUMMER, FALL in order", () => {
    expect(SEASON_ORDER).toEqual(["WINTER", "SPRING", "SUMMER", "FALL"]);
  });

  it("round-trips season keys", () => {
    expect(getSeasonKey("WINTER", 2026)).toBe("WINTER_2026");
    expect(parseSeasonKey("WINTER_2026")).toEqual({ season: "WINTER", year: 2026 });
    expect(parseSeasonKey("winter_2026")).toBeNull();
    expect(parseSeasonKey("WINTER-2026")).toBeNull();
    expect(parseSeasonKey("not-a-season")).toBeNull();
  });

  it("orders seasons for the season challenge", () => {
    expect(getSeasonOrdinal("WINTER", 2026)).toBeLessThan(getSeasonOrdinal("SPRING", 2026));
    expect(isSeasonChallengeEligible("SPRING", 2026, { season: "WINTER", year: 2026 })).toBe(true);
    expect(isSeasonChallengeEligible("WINTER", 2026, { season: "SPRING", year: 2026 })).toBe(false);
    expect(isSeasonChallengeEligible("WINTER", 2026, { season: "WINTER", year: 2026 })).toBe(true);
  });

  it("validates season names and badge keys", () => {
    expect(isValidSeason("FALL")).toBe(true);
    expect(isValidSeason("autumn")).toBe(false);
    expect(getSeasonBadgeKey("SPRING")).toBe("SPRING_WATCHER");
    expect(isSeasonalWatcherBadge("FALL_WATCHER")).toBe(true);
    expect(isSeasonalWatcherBadge("FIRST_FINISH")).toBe(false);
  });

  it("formats labels and browse hrefs", () => {
    expect(formatSeasonLabel("WINTER")).toBe("Winter");
    expect(formatSeasonBadgeLabel("SPRING_2026")).toBe("Spring 2026 Watcher");
    expect(formatSeasonBadgeLabel("nope")).toBe("Season Watcher");
    expect(getSeasonBrowseSearchHref("WINTER", 2026)).toBe(
      "/search?type=anime&season=winter&year=2026&mode=browse"
    );
  });
});
