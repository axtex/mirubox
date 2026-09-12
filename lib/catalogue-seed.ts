import { prisma } from "@/lib/prisma";
import {
  ANILIST_CRON_REQUEST,
  getMediaCardsByIds,
  getPopularForEmbeddings,
  getSeasonalAnime,
} from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { hydrateAniListCircuit, shouldSkipAniList } from "@/lib/anilist-circuit";
import {
  CARD_TTL_FINISHED_MS,
  CARD_TTL_RELEASING_MS,
} from "@/lib/cache-utils";
import { getCurrentSeason, getNextSeason } from "@/lib/season";
import type { AnimeCard, MediaPage } from "@/types/anilist";

export interface CatalogueSeedResult {
  skipped?: boolean;
  cardsCached: number;
  popularAnime: number;
  popularManga: number;
  seasonal: number;
  upcoming: number;
  trackerRefreshed: number;
  duration: number;
}

async function cacheCards(media: AnimeCard[]): Promise<number> {
  const unique = new Map<number, AnimeCard>();
  for (const card of media) unique.set(card.id, card);
  await Promise.all(
    [...unique.values()].map((card) => cacheAnimeCard(card, { force: true })),
  );
  return unique.size;
}

const EMPTY_PAGE: MediaPage = {
  pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
  media: [],
};

async function safePage(
  label: string,
  load: () => Promise<MediaPage>,
): Promise<MediaPage> {
  try {
    return await load();
  } catch (err) {
    console.error(`[catalogue-seed] ${label} failed:`, err);
    return EMPTY_PAGE;
  }
}

/**
 * Upsert popular + seasonal catalogue rows and refresh stale tracker titles.
 * Safe to call while AniList is healthy; no-ops when the circuit is open.
 */
export async function seedCatalogue(): Promise<CatalogueSeedResult> {
  const started = Date.now();
  await hydrateAniListCircuit();
  if (shouldSkipAniList()) {
    return {
      skipped: true,
      cardsCached: 0,
      popularAnime: 0,
      popularManga: 0,
      seasonal: 0,
      upcoming: 0,
      trackerRefreshed: 0,
      duration: Date.now() - started,
    };
  }

  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const [anime1, anime2, manga1, seasonal, upcoming] = await Promise.all([
    safePage("popular-anime-1", () =>
      getPopularForEmbeddings("ANIME", 1, 50, { sort: "POPULARITY_DESC" }),
    ),
    safePage("popular-anime-2", () =>
      getPopularForEmbeddings("ANIME", 2, 50, { sort: "POPULARITY_DESC" }),
    ),
    safePage("popular-manga-1", () =>
      getPopularForEmbeddings("MANGA", 1, 50, { sort: "POPULARITY_DESC" }),
    ),
    safePage("seasonal", () => getSeasonalAnime(season, year, 1, 50)),
    safePage("upcoming", () => getSeasonalAnime(nextSeason, nextYear, 1, 50)),
  ]);

  const popularAnimeCards = [...anime1.media, ...anime2.media];
  const popularMangaCards = manga1.media;
  const seasonalCards = seasonal.media;
  const upcomingCards = upcoming.media;

  let cardsCached = await cacheCards([
    ...popularAnimeCards,
    ...popularMangaCards,
    ...seasonalCards,
    ...upcomingCards,
  ]);

  const releasingCutoff = new Date(Date.now() - CARD_TTL_RELEASING_MS);
  const finishedCutoff = new Date(Date.now() - CARD_TTL_FINISHED_MS);
  const staleTracked = await prisma.anime.findMany({
    where: {
      trackerEntries: { some: {} },
      OR: [
        {
          status: { in: ["RELEASING", "NOT_YET_RELEASED", "HIATUS"] },
          cachedAt: { lt: releasingCutoff },
        },
        {
          status: { notIn: ["RELEASING", "NOT_YET_RELEASED", "HIATUS"] },
          cachedAt: { lt: finishedCutoff },
        },
      ],
    },
    select: { id: true },
    take: 50,
  });

  let trackerRefreshed = 0;
  if (staleTracked.length > 0) {
    try {
      const live = await getMediaCardsByIds(
        staleTracked.map((row) => row.id),
        ANILIST_CRON_REQUEST,
      );
      trackerRefreshed = live.length;
      cardsCached += await cacheCards(live);
    } catch (err) {
      console.error("[catalogue-seed] tracker refresh failed:", err);
    }
  }

  return {
    cardsCached,
    popularAnime: popularAnimeCards.length,
    popularManga: popularMangaCards.length,
    seasonal: seasonalCards.length,
    upcoming: upcomingCards.length,
    trackerRefreshed,
    duration: Date.now() - started,
  };
}
