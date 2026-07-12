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
}

async function upsertShelf(
  key: BrowseShelfKey,
  media: AnimeCard[],
  meta?: Prisma.InputJsonValue,
): Promise<void> {
  const mediaIds = media.map((m) => m.id);
  const syncedAt = new Date();
  await prisma.browseShelf.upsert({
    where: { key },
    create: { key, mediaIds, meta: meta ?? undefined, syncedAt },
    update: { mediaIds, meta: meta ?? undefined, syncedAt },
  });
}

async function cacheCards(media: AnimeCard[]): Promise<number> {
  const unique = new Map<number, AnimeCard>();
  for (const card of media) unique.set(card.id, card);
  await Promise.all(
    [...unique.values()].map((card) => cacheAnimeCard(card, { force: true })),
  );
  return unique.size;
}

/**
 * Pull browse shelves from AniList into Postgres + Anime card cache.
 * Safe to call from cron or as a background seed when shelves are empty.
 */
export async function syncBrowseShelves(): Promise<BrowseSyncResult> {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const [home, anime, manga] = await Promise.all([
    fetchHomePageMedia(season, year, nextSeason, nextYear),
    fetchAnimeBrowseMedia(season, year, nextSeason, nextYear),
    fetchMangaBrowseMedia(),
  ]);

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

  const cardsCached = await cacheCards(allCards);

  await Promise.all([
    upsertShelf("home:trending", home.trending.media, seasonMeta),
    upsertShelf("home:seasonal", home.seasonal.media, seasonMeta),
    upsertShelf("home:upcoming", home.upcoming.media, seasonMeta),
    upsertShelf("home:manga", home.manga.media, seasonMeta),
    upsertShelf("anime:trending", anime.trending.media, seasonMeta),
    upsertShelf("anime:seasonal", anime.seasonal.media, seasonMeta),
    upsertShelf("anime:upcoming", anime.upcoming.media, seasonMeta),
    upsertShelf("anime:topRated", anime.topRated.media, seasonMeta),
    upsertShelf("manga:trending", manga.trending.media),
    upsertShelf("manga:publishing", manga.publishing.media),
    upsertShelf("manga:allTime", manga.allTime.media),
  ]);

  for (const tag of BROWSE_CACHE_TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // Outside a Next.js request (scripts) revalidate is a no-op
    }
  }

  const shelves: Record<string, number> = {
    "home:trending": home.trending.media.length,
    "home:seasonal": home.seasonal.media.length,
    "home:upcoming": home.upcoming.media.length,
    "home:manga": home.manga.media.length,
    "anime:trending": anime.trending.media.length,
    "anime:seasonal": anime.seasonal.media.length,
    "anime:upcoming": anime.upcoming.media.length,
    "anime:topRated": anime.topRated.media.length,
    "manga:trending": manga.trending.media.length,
    "manga:publishing": manga.publishing.media.length,
    "manga:allTime": manga.allTime.media.length,
  };

  return {
    syncedAt: new Date().toISOString(),
    shelves,
    cardsCached,
  };
}
