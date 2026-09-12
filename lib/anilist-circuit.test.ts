import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { upsert, findUnique } = vi.hoisted(() => ({
  upsert: vi.fn(async () => ({})),
  findUnique: vi.fn(async () => null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    browseShelf: {
      upsert,
      findUnique,
    },
  },
}));

import {
  AniListUnavailableError,
  hydrateAniListCircuit,
  isAniListOutageError,
  recordAniListFailure,
  recordAniListSuccess,
  resetAniListCircuitForTests,
  shouldSkipAniList,
} from "@/lib/anilist-circuit";

describe("AniList circuit", () => {
  beforeEach(async () => {
    resetAniListCircuitForTests();
    upsert.mockClear();
    findUnique.mockClear();
    await hydrateAniListCircuit();
  });

  afterEach(() => {
    resetAniListCircuitForTests();
  });

  it("stays closed until three outages, then skips AniList", () => {
    expect(shouldSkipAniList()).toBe(false);
    recordAniListFailure();
    recordAniListFailure();
    expect(shouldSkipAniList()).toBe(false);
    recordAniListFailure();
    expect(shouldSkipAniList()).toBe(true);
  });

  it("closes again after a successful probe", () => {
    recordAniListFailure();
    recordAniListFailure();
    recordAniListFailure();
    expect(shouldSkipAniList()).toBe(true);
    recordAniListSuccess();
    expect(shouldSkipAniList()).toBe(false);
  });
});

describe("isAniListOutageError", () => {
  it("treats timeouts and 403s as outages, not 429s or pacing", () => {
    expect(isAniListOutageError(new AniListUnavailableError("timeout"))).toBe(true);
    expect(isAniListOutageError(new AniListUnavailableError("circuit_open"))).toBe(true);
    expect(isAniListOutageError(new AniListUnavailableError("paced"))).toBe(false);
    expect(isAniListOutageError(new Error("AniList request timed out"))).toBe(true);
    expect(isAniListOutageError(new Error("Failed to fetch data from AniList"))).toBe(true);
    expect(
      isAniListOutageError({ response: { status: 403 }, message: "disabled" }),
    ).toBe(true);
    expect(isAniListOutageError({ response: { status: 429 } })).toBe(false);
    expect(isAniListOutageError(new Error("Too Many Requests"))).toBe(false);
  });
});
