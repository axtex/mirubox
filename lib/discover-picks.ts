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
    const rows = await prisma.anime.findMany({ where: { id: { in: ids } } });
    for (const row of rows) {
      if (row.type === type) map.set(row.id, dbRowToAnimeCard(row));
    }
  } catch { /* DB unavailable */ }

  const missing = ids.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  const fetched = await getMediaCardsByIds(missing);
  for (const card of fetched) {
    if (card.type !== type) continue;
    map.set(card.id, card);
    // Don't block the page on cache writes — upsert in the background.
    void cacheAnimeCard(card);
  }

  return map;
}

export async function fetchDiscoverPicks(
  type: DiscoverMediaType = "ANIME",
): Promise<DiscoverPick[]> {
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
