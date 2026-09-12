import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import {
  fetchHomePageMedia,
  fetchAnimeBrowseMedia,
  fetchMangaBrowseMedia,
  getCurrentSeason,
  getNextSeason,
} from "@/lib/anilist";
import { hydrateAniListCircuit, isAniListCircuitOpen } from "@/lib/anilist-circuit";
import type { AnimeCard } from "@/types/anilist";
import type { Prisma } from "@prisma/client";

export const BROWSE_SHELF_KEYS = [
  "home:trending",
  "home:seasonal",
  "home:upcoming",
  "home:manga",
  "anime:trending",
  "anime:seasonal",
  "anime:upcoming",
  "anime:topRated",
  "manga:trending",
  "manga:publishing",
  "manga:allTime",
] as const;

export type BrowseShelfKey = (typeof BROWSE_SHELF_KEYS)[number];

export const BROWSE_CACHE_TAGS = [
  "home-anilist",
  "anime-browse-anilist",
  "manga-browse-anilist",
  "browse-shelves",
] as const;

export interface BrowseSyncResult {
  syncedAt: string;
  shelves: Record<string, number>;
  cardsCached: number;
  skipped?: boolean;
  source?: "anilist" | "catalogue";
}

/** Never replace a populated shelf with an empty AniList miss. */
export function shouldWriteShelfIds(existingIds: number[], incomingIds: number[]): boolean {
  if (incomingIds.length > 0) return true;
  return existingIds.length === 0;
}

async function upsertShelfIds(
  key: BrowseShelfKey,
  mediaIds: number[],
  meta?: Prisma.InputJsonValue,
): Promise<number> {
  const existing = await prisma.browseShelf.findUnique({ where: { key } });
  const existingIds = existing?.mediaIds ?? [];
  if (!shouldWriteShelfIds(existingIds, mediaIds)) {
    return existingIds.length;
  }

  const syncedAt = new Date();
  await prisma.browseShelf.upsert({
    where: { key },
    create: { key, mediaIds, meta: meta ?? undefined, syncedAt },
    update: { mediaIds, meta: meta ?? undefined, syncedAt },
  });
  return mediaIds.length;
}

async function upsertShelf(
  key: BrowseShelfKey,
  media: AnimeCard[],
  meta?: Prisma.InputJsonValue,
): Promise<number> {
  return upsertShelfIds(key, media.map((m) => m.id), meta);
}

async function cacheCards(media: AnimeCard[]): Promise<number> {
  const unique = new Map<number, AnimeCard>();
  for (const card of media) unique.set(card.id, card);
  await Promise.all(
    [...unique.values()].map((card) => cacheAnimeCard(card, { force: true })),
  );
  return unique.size;
}

function revalidateBrowseTags(): void {
  for (const tag of BROWSE_CACHE_TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // Outside a Next.js request (scripts) revalidate is a no-op
    }
  }
}

const HAS_COVER: Prisma.AnimeWhereInput = { coverImage: { not: null } };

async function catalogueIds(
  where: Prisma.AnimeWhereInput,
  orderBy: Prisma.AnimeOrderByWithRelationInput[],
  take: number,
): Promise<number[]> {
  const rows = await prisma.anime.findMany({
    where: { ...HAS_COVER, ...where },
    orderBy,
    take,
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/**
 * Build home/anime/manga shelf ID lists from cached Anime rows.
 * Used when AniList is down so empty shelves do not stay blank.
 */
export async function fillShelvesFromCatalogue(): Promise<BrowseSyncResult> {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();
  const seasonMeta = {
    season,
    year,
    nextSeason,
    nextYear,
    source: "catalogue",
  } satisfies Prisma.InputJsonObject;

  const popularity = [{ popularity: "desc" as const }, { averageScore: "desc" as const }];
  const score = [{ averageScore: "desc" as const }, { popularity: "desc" as const }];

  const [
    homeTrending,
    homeSeasonal,
    homeUpcoming,
    homeManga,
    animeTrending,
    animeSeasonal,
    animeUpcoming,
    animeTopRated,
    mangaTrending,
    mangaPublishing,
    mangaAllTime,
  ] = await Promise.all([
    catalogueIds({ type: "ANIME" }, popularity, 28),
    catalogueIds({ type: "ANIME", season, seasonYear: year }, popularity, 20),
    catalogueIds({ type: "ANIME", season: nextSeason, seasonYear: nextYear }, popularity, 20),
    catalogueIds({ type: "MANGA" }, popularity, 7),
    catalogueIds({ type: "ANIME" }, popularity, 20),
    catalogueIds({ type: "ANIME", season, seasonYear: year }, popularity, 20),
    catalogueIds({ type: "ANIME", season: nextSeason, seasonYear: nextYear }, popularity, 20),
    catalogueIds({ type: "ANIME", averageScore: { not: null }, popularity: { gte: 10000 } }, score, 20),
    catalogueIds({ type: "MANGA" }, popularity, 14),
    catalogueIds({ type: "MANGA", status: "RELEASING" }, popularity, 14),
    catalogueIds({ type: "MANGA", averageScore: { not: null } }, score, 14),
  ]);

  const shelves: Record<string, number> = {
    "home:trending": await upsertShelfIds("home:trending", homeTrending, seasonMeta),
    "home:seasonal": await upsertShelfIds("home:seasonal", homeSeasonal, seasonMeta),
    "home:upcoming": await upsertShelfIds("home:upcoming", homeUpcoming, seasonMeta),
    "home:manga": await upsertShelfIds("home:manga", homeManga, seasonMeta),
    "anime:trending": await upsertShelfIds("anime:trending", animeTrending, seasonMeta),
    "anime:seasonal": await upsertShelfIds("anime:seasonal", animeSeasonal, seasonMeta),
    "anime:upcoming": await upsertShelfIds("anime:upcoming", animeUpcoming, seasonMeta),
    "anime:topRated": await upsertShelfIds("anime:topRated", animeTopRated, seasonMeta),
    "manga:trending": await upsertShelfIds("manga:trending", mangaTrending),
    "manga:publishing": await upsertShelfIds("manga:publishing", mangaPublishing),
    "manga:allTime": await upsertShelfIds("manga:allTime", mangaAllTime),
  };

  revalidateBrowseTags();

  return {
    syncedAt: new Date().toISOString(),
    shelves,
    cardsCached: 0,
    source: "catalogue",
  };
}

/**
 * Pull browse shelves from AniList into Postgres + Anime card cache.
 * If AniList is down or returns nothing, fill from the cached catalogue instead.
 * Never overwrites a populated shelf with an empty list.
 */
export async function syncBrowseShelves(): Promise<BrowseSyncResult> {
  await hydrateAniListCircuit();
  if (isAniListCircuitOpen()) {
    return fillShelvesFromCatalogue();
  }

  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  let home: Awaited<ReturnType<typeof fetchHomePageMedia>>;
  let anime: Awaited<ReturnType<typeof fetchAnimeBrowseMedia>>;
  let manga: Awaited<ReturnType<typeof fetchMangaBrowseMedia>>;
  try {
    [home, anime, manga] = await Promise.all([
      fetchHomePageMedia(season, year, nextSeason, nextYear),
      fetchAnimeBrowseMedia(season, year, nextSeason, nextYear),
      fetchMangaBrowseMedia(),
    ]);
  } catch (err) {
    console.error("Browse AniList fetch failed, filling from catalogue:", err);
    return fillShelvesFromCatalogue();
  }

  const seasonMeta = {
    season,
    year,
    nextSeason,
    nextYear,
  } satisfies Prisma.InputJsonObject;

  const allCards = [
    ...home.trending.media,
    ...home.seasonal.media,
    ...home.upcoming.media,
    ...home.manga.media,
    ...anime.trending.media,
    ...anime.seasonal.media,
    ...anime.upcoming.media,
    ...anime.topRated.media,
    ...manga.trending.media,
    ...manga.publishing.media,
    ...manga.allTime.media,
  ];

  if (allCards.length === 0) {
    return fillShelvesFromCatalogue();
  }

  const cardsCached = await cacheCards(allCards);

  const shelves: Record<string, number> = {
    "home:trending": await upsertShelf("home:trending", home.trending.media, seasonMeta),
    "home:seasonal": await upsertShelf("home:seasonal", home.seasonal.media, seasonMeta),
    "home:upcoming": await upsertShelf("home:upcoming", home.upcoming.media, seasonMeta),
    "home:manga": await upsertShelf("home:manga", home.manga.media, seasonMeta),
    "anime:trending": await upsertShelf("anime:trending", anime.trending.media, seasonMeta),
    "anime:seasonal": await upsertShelf("anime:seasonal", anime.seasonal.media, seasonMeta),
    "anime:upcoming": await upsertShelf("anime:upcoming", anime.upcoming.media, seasonMeta),
    "anime:topRated": await upsertShelf("anime:topRated", anime.topRated.media, seasonMeta),
    "manga:trending": await upsertShelf("manga:trending", manga.trending.media),
    "manga:publishing": await upsertShelf("manga:publishing", manga.publishing.media),
    "manga:allTime": await upsertShelf("manga:allTime", manga.allTime.media),
  };

  revalidateBrowseTags();

  return {
    syncedAt: new Date().toISOString(),
    shelves,
    cardsCached,
    source: "anilist",
  };
}
