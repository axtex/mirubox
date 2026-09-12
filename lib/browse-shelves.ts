import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { fillShelvesFromCatalogue, syncBrowseShelves, type BrowseShelfKey } from "@/lib/browse-sync";
import { dbRowToAnimeCard, ANIME_CARD_SELECT } from "@/lib/catalogue-db";
import type { AnimeCard } from "@/types/anilist";

async function loadOrderedCards(mediaIds: number[]): Promise<AnimeCard[]> {
  if (mediaIds.length === 0) return [];
  const rows = await prisma.anime.findMany({
    where: { id: { in: mediaIds } },
    select: ANIME_CARD_SELECT,
  });
  const byId = new Map(rows.map((row) => [row.id, dbRowToAnimeCard(row)]));
  return mediaIds.map((id) => byId.get(id)).filter((card): card is AnimeCard => card != null);
}

let syncScheduledForRequest = false;
let catalogueFill: Promise<void> | null = null;

function scheduleShelfSync(): void {
  if (syncScheduledForRequest) return;
  syncScheduledForRequest = true;
  after(() => {
    void syncBrowseShelves().catch((err) => {
      console.error("Background browse shelf sync failed:", err);
    });
  });
}

async function fillCatalogueShelvesIfNeeded(): Promise<void> {
  if (!catalogueFill) {
    catalogueFill = fillShelvesFromCatalogue()
      .then(() => undefined)
      .catch((err) => {
        console.error("Catalogue shelf fill failed:", err);
      });
  }
  await catalogueFill;
}

/** Load a browse shelf from Postgres. Empty → fill from cached titles, then AniList in the background. */
export async function getShelfCards(key: BrowseShelfKey): Promise<AnimeCard[]> {
  try {
    let shelf = await prisma.browseShelf.findUnique({ where: { key } });
    if (!shelf || shelf.mediaIds.length === 0) {
      await fillCatalogueShelvesIfNeeded();
      shelf = await prisma.browseShelf.findUnique({ where: { key } });
      scheduleShelfSync();
    }
    if (!shelf || shelf.mediaIds.length === 0) {
      scheduleShelfSync();
      return [];
    }
    const cards = await loadOrderedCards(shelf.mediaIds);
    if (cards.length === 0) {
      scheduleShelfSync();
    }
    return cards;
  } catch (err) {
    console.error(`Failed to load browse shelf ${key}:`, err);
    scheduleShelfSync();
    return [];
  }
}

export interface HomeShelves {
  trending: AnimeCard[];
  seasonal: AnimeCard[];
  upcoming: AnimeCard[];
  manga: AnimeCard[];
}

export async function getHomeShelves(): Promise<HomeShelves> {
  const [trending, seasonal, upcoming, manga] = await Promise.all([
    getShelfCards("home:trending"),
    getShelfCards("home:seasonal"),
    getShelfCards("home:upcoming"),
    getShelfCards("home:manga"),
  ]);

  if (
    trending.length === 0 &&
    seasonal.length === 0 &&
    upcoming.length === 0 &&
    manga.length === 0
  ) {
    scheduleShelfSync();
  }

  return { trending, seasonal, upcoming, manga };
}

export interface AnimeBrowseShelves {
  trending: AnimeCard[];
  seasonal: AnimeCard[];
  upcoming: AnimeCard[];
  topRated: AnimeCard[];
}

export async function getAnimeBrowseShelves(): Promise<AnimeBrowseShelves> {
  const [trending, seasonal, upcoming, topRated] = await Promise.all([
    getShelfCards("anime:trending"),
    getShelfCards("anime:seasonal"),
    getShelfCards("anime:upcoming"),
    getShelfCards("anime:topRated"),
  ]);

  if (
    trending.length === 0 &&
    seasonal.length === 0 &&
    upcoming.length === 0 &&
    topRated.length === 0
  ) {
    scheduleShelfSync();
  }

  return { trending, seasonal, upcoming, topRated };
}

export interface MangaBrowseShelves {
  trending: AnimeCard[];
  publishing: AnimeCard[];
  allTime: AnimeCard[];
}

export async function getMangaBrowseShelves(): Promise<MangaBrowseShelves> {
  const [trending, publishing, allTime] = await Promise.all([
    getShelfCards("manga:trending"),
    getShelfCards("manga:publishing"),
    getShelfCards("manga:allTime"),
  ]);

  if (trending.length === 0 && publishing.length === 0 && allTime.length === 0) {
    scheduleShelfSync();
  }

  return { trending, publishing, allTime };
}
