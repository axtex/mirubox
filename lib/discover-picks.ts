import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getMediaCardsByIds } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { DISCOVER_ENTRIES, type DiscoverMediaType, type DiscoverEntry } from "@/lib/discover-entries";
import type { AnimeCard } from "@/types/anilist";

export type { DiscoverMediaType, DiscoverEntry };
export { ANIME_DISCOVER, MANGA_DISCOVER } from "@/lib/discover-entries";

export interface GenreTile {
  genre: string;
  descriptor: string;
  tint: string;
  href: string;
}

export interface DiscoverPick {
  label: string;
  anime: AnimeCard;
}

const GENRE_POOL: GenreTile[] = [
  { genre: "Psychological", descriptor: "Dark, twisty, stays with you",     tint: "rgba(100,120,180,0.12)", href: "/search?genre=Psychological&mode=browse" },
  { genre: "Fantasy",       descriptor: "Vast worlds, ancient magic",       tint: "rgba(140,100,200,0.12)", href: "/search?genre=Fantasy&mode=browse"       },
  { genre: "Romance",       descriptor: "Tender moments, aching tension",   tint: "rgba(200,80,100,0.10)",  href: "/search?genre=Romance&mode=browse"       },
  { genre: "Action",        descriptor: "Kinetic. High-stakes. Legendary.", tint: "rgba(232,23,63,0.10)",   href: "/search?genre=Action&mode=browse"        },
  { genre: "Slice of Life", descriptor: "Quiet, warm, deeply human",        tint: "rgba(180,160,100,0.10)", href: "/search?genre=Slice+of+Life&mode=browse" },
  { genre: "Thriller",      descriptor: "Paranoia, twists, can't look away",tint: "rgba(60,80,100,0.15)",   href: "/search?genre=Thriller&mode=browse"      },
];

const DISCOVER_DB_SELECT = {
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

export function getDaySeededGenres(): GenreTile[] {
  const day = Math.floor(Date.now() / 86400000);
  const start = day % GENRE_POOL.length;
  return [0, 1, 2].map((i) => GENRE_POOL[(start + i) % GENRE_POOL.length]);
}

function dbRowToAnimeCard(row: {
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
}): AnimeCard {
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

async function loadMediaMap(
  ids: number[],
  type: DiscoverMediaType,
): Promise<Map<number, AnimeCard>> {
  const map = new Map<number, AnimeCard>();

  try {
    const rows = await prisma.anime.findMany({
      where: { id: { in: ids } },
      select: DISCOVER_DB_SELECT,
    });
    for (const row of rows) {
      if (row.type === type) map.set(row.id, dbRowToAnimeCard(row));
    }
  } catch { /* DB unavailable */ }

  const missing = ids.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  // AniList can timeout / 429 under load — keep DB hits and skip missing IDs.
  try {
    const fetched = await getMediaCardsByIds(missing);
    for (const card of fetched) {
      if (card.type !== type) continue;
      map.set(card.id, card);
      // Don't block the page on cache writes — upsert in the background.
      void cacheAnimeCard(card);
    }
  } catch (err) {
    console.error("Discover AniList fallback failed:", err);
  }

  return map;
}

async function loadDiscoverPicks(type: DiscoverMediaType): Promise<DiscoverPick[]> {
  const entries = DISCOVER_ENTRIES[type];
  const allIds = [...new Set(entries.map((entry) => entry.id))];
  const mediaMap = await loadMediaMap(allIds, type);

  const picks: DiscoverPick[] = [];
  for (const entry of entries) {
    const anime = mediaMap.get(entry.id);
    if (anime) picks.push({ label: entry.label, anime });
  }

  return picks;
}

const getCachedDiscoverPicks = unstable_cache(
  async (type: DiscoverMediaType) => loadDiscoverPicks(type),
  ["discover-picks"],
  { revalidate: 3600, tags: ["discover-picks"] },
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle + dedupe on the server so the client can paint immediately. */
export function selectDiscoverPicks(
  picks: DiscoverPick[],
  maxItems: number,
): DiscoverPick[] {
  const shuffled = shuffle(picks);
  const seenIds = new Set<number>();
  const seenLabels = new Set<string>();
  const unique: DiscoverPick[] = [];

  for (const pick of shuffled) {
    if (seenIds.has(pick.anime.id) || seenLabels.has(pick.label)) continue;
    seenIds.add(pick.anime.id);
    seenLabels.add(pick.label);
    unique.push(pick);
    if (unique.length >= maxItems) break;
  }

  return unique;
}

export async function fetchDiscoverPicks(
  type: DiscoverMediaType = "ANIME",
): Promise<DiscoverPick[]> {
  return getCachedDiscoverPicks(type);
}
