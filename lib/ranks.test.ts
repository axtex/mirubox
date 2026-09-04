import { describe, expect, it } from "vitest";
import { computeRank, getRankProgress, RANKS } from "@/lib/ranks";

describe("computeRank", () => {
  it("maps each threshold and the value just below it", () => {
    expect(computeRank(0)).toBe("WATCHER");
    expect(computeRank(99)).toBe("WATCHER");
    expect(computeRank(100)).toBe("TRACKER");
    expect(computeRank(499)).toBe("TRACKER");
    expect(computeRank(500)).toBe("ARCHIVIST");
    expect(computeRank(999)).toBe("ARCHIVIST");
    expect(computeRank(1000)).toBe("CURATOR");
    expect(computeRank(1999)).toBe("CURATOR");
    expect(computeRank(2000)).toBe("SCHOLAR");
    expect(computeRank(3499)).toBe("SCHOLAR");
    expect(computeRank(3500)).toBe("SAGE");
    expect(computeRank(4999)).toBe("SAGE");
    expect(computeRank(5000)).toBe("LEGEND");
    expect(computeRank(99_999)).toBe("LEGEND");
  });

  it("treats negative XP as Watcher", () => {
    expect(computeRank(-1)).toBe("WATCHER");
  });

  it("uses the RANKS table as the ladder", () => {
    expect(RANKS.map((r) => [r.name, r.min])).toEqual([
      ["WATCHER", 0],
      ["TRACKER", 100],
      ["ARCHIVIST", 500],
      ["CURATOR", 1000],
      ["SCHOLAR", 2000],
      ["SAGE", 3500],
      ["LEGEND", 5000],
    ]);
  });
});

describe("getRankProgress", () => {
  it("is 0% at the start of Watcher and 50% halfway to Tracker", () => {
    const start = getRankProgress(0);
    expect(start.name).toBe("WATCHER");
    expect(start.nextName).toBe("TRACKER");
    expect(start.nextMinXP).toBe(100);
    expect(start.progressPct).toBe(0);
    expect(start.isMax).toBe(false);

    expect(getRankProgress(50).progressPct).toBe(50);
    expect(getRankProgress(99).progressPct).toBe(99);
  });

  it("resets progress at a new rank and measures toward the next", () => {
    const tracker = getRankProgress(100);
    expect(tracker.name).toBe("TRACKER");
    expect(tracker.minXP).toBe(100);
    expect(tracker.nextName).toBe("ARCHIVIST");
    expect(tracker.nextMinXP).toBe(500);
    expect(tracker.progressPct).toBe(0);

    expect(getRankProgress(300).progressPct).toBe(50);
  });

  it("is maxed at Legend", () => {
    const legend = getRankProgress(5000);
    expect(legend.name).toBe("LEGEND");
    expect(legend.nextName).toBeNull();
    expect(legend.nextMinXP).toBeNull();
    expect(legend.progressPct).toBe(100);
    expect(legend.isMax).toBe(true);
  });

  it("clamps negative XP progress at 0%", () => {
    const progress = getRankProgress(-1);
    expect(progress.name).toBe("WATCHER");
    expect(progress.progressPct).toBe(0);
  });
});
