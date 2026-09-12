import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AnimeCard, MediaPage } from "@/types/anilist";

export const ANIME_CARD_SELECT = {
  id: true,
  title: true,
  titleEnglish: true,
  titleNative: true,
  coverImage: true,
  bannerImage: true,
  genres: true,
  episodes: true,
  chapters: true,
  status: true,
  season: true,
  seasonYear: true,
  averageScore: true,
  popularity: true,
  format: true,
  type: true,
} as const;

export type AnimeCardRow = {
  id: number;
  title: string;
  titleEnglish: string | null;
  titleNative: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  genres: string[];
  episodes: number | null;
  chapters: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity: number | null;
  format: string | null;
  type: string;
};

export function dbRowToAnimeCard(row: AnimeCardRow): AnimeCard {
  return {
    id: row.id,
    title: { romaji: row.title, english: row.titleEnglish, native: row.titleNative },
    coverImage: { large: row.coverImage, extraLarge: row.coverImage },
    bannerImage: row.bannerImage,
    genres: row.genres,
    episodes: row.episodes,
    chapters: row.chapters,
    status: row.status,
    season: row.season,
    seasonYear: row.seasonYear,
    averageScore: row.averageScore,
    popularity: row.popularity,
    format: row.format,
    type: row.type,
    tags: [],
    rankings: [],
  };
}

export interface CatalogueCardHit {
  card: AnimeCard;
  cachedAt: Date;
  status: string | null;
}

export async function loadCatalogueCardsByIds(ids: number[]): Promise<CatalogueCardHit[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.anime.findMany({
    where: { id: { in: ids } },
    select: { ...ANIME_CARD_SELECT, cachedAt: true },
  });
  return rows.map((row) => ({
    card: dbRowToAnimeCard(row),
    cachedAt: row.cachedAt,
    status: row.status,
  }));
}

export interface CatalogueSearchFilters {
  genres?: string[];
  tags?: string[];
  status?: string;
  format?: string;
  year?: number;
  season?: string;
  sort?: string;
}

function emptyPage(page: number): MediaPage {
  return {
    pageInfo: {
      total: 0,
      currentPage: page,
      lastPage: 1,
      hasNextPage: false,
    },
    media: [],
  };
}

function orderByForSort(sort: string | undefined): Prisma.AnimeOrderByWithRelationInput[] {
  if (sort === "SCORE_DESC") return [{ averageScore: "desc" }, { popularity: "desc" }];
  return [{ popularity: "desc" }, { averageScore: "desc" }];
}

/** Postgres keyword/filter search used when AniList is down or the circuit is open. */
export async function searchCatalogue(
  query: string,
  type: "ANIME" | "MANGA",
  filters: CatalogueSearchFilters = {},
  page = 1,
  perPage = 20,
): Promise<MediaPage> {
  if (filters.tags?.length) {
    return emptyPage(page);
  }

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? Math.min(Math.floor(perPage), 50) : 20;
  const skip = (safePage - 1) * safePerPage;
  const trimmed = query.trim();

  const where: Prisma.AnimeWhereInput = { type };
  if (filters.genres?.length) where.genres = { hasSome: filters.genres };
  if (filters.status) where.status = filters.status;
  if (filters.format) where.format = filters.format;
  if (filters.year) where.seasonYear = filters.year;
  if (filters.season) where.season = filters.season;

  if (trimmed) {
    where.OR = [
      { title: { contains: trimmed, mode: "insensitive" } },
      { titleEnglish: { contains: trimmed, mode: "insensitive" } },
      { titleNative: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.anime.count({ where }),
    prisma.anime.findMany({
      where,
      orderBy: orderByForSort(filters.sort),
      skip,
      take: safePerPage,
      select: ANIME_CARD_SELECT,
    }),
  ]);
  const lastPage = Math.max(1, Math.ceil(total / safePerPage));
  return {
    pageInfo: {
      total,
      currentPage: safePage,
      lastPage,
      hasNextPage: safePage < lastPage,
    },
    media: rows.map(dbRowToAnimeCard),
  };
}
