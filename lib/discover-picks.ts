import { prisma } from "@/lib/prisma";
import { getMediaCardsByIds } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import type { AnimeCard } from "@/types/anilist";

export interface GenreTile {
  genre: string;
  descriptor: string;
  tint: string;
  href: string;
}

export type DiscoverMediaType = "ANIME" | "MANGA";

export interface DiscoverPick {
  label: string;
  anime: AnimeCard;
}

interface DiscoverEntry {
  label: string;
  id: number;
}

const GENRE_POOL: GenreTile[] = [
  { genre: "Psychological", descriptor: "Dark, twisty, stays with you",     tint: "rgba(100,120,180,0.12)", href: "/search?genre=Psychological&mode=browse" },
  { genre: "Fantasy",       descriptor: "Vast worlds, ancient magic",       tint: "rgba(140,100,200,0.12)", href: "/search?genre=Fantasy&mode=browse"       },
  { genre: "Romance",       descriptor: "Tender moments, aching tension",   tint: "rgba(200,80,100,0.10)",  href: "/search?genre=Romance&mode=browse"       },
  { genre: "Action",        descriptor: "Kinetic. High-stakes. Legendary.", tint: "rgba(232,23,63,0.10)",   href: "/search?genre=Action&mode=browse"        },
  { genre: "Slice of Life", descriptor: "Quiet, warm, deeply human",        tint: "rgba(180,160,100,0.10)", href: "/search?genre=Slice+of+Life&mode=browse" },
  { genre: "Thriller",      descriptor: "Paranoia, twists, can't look away",tint: "rgba(60,80,100,0.15)",   href: "/search?genre=Thriller&mode=browse"      },
];

const ANIME_DISCOVER: DiscoverEntry[] = [
  { label: "cozy witches", id: 431 },
  { label: "countryside magic", id: 21858 },
  { label: "soft magic", id: 112609 },
  { label: "wrong for good reasons", id: 101348 },
  { label: "can't go back", id: 19 },
  { label: "guilty minds", id: 20755 },
  { label: "found family", id: 5114 },
  { label: "chosen family", id: 154587 },
  { label: "somewhere to belong", id: 103195 },
  { label: "slow burn", id: 21827 },
  { label: "worth the wait", id: 10165 },
  { label: "almost said it", id: 20954 },
  { label: "brain rot art", id: 8795 },
  { label: "visually unhinged", id: 227 },
  { label: "fever dream frames", id: 2246 },
  { label: "legendary openers", id: 1 },
  { label: "instant hook", id: 9253 },
  { label: "never recovered", id: 16498 },
  { label: "quiet devastation", id: 30 },
  { label: "fell apart beautifully", id: 100388 },
  { label: "gentle grief", id: 9989 },
  { label: "already canon", id: 140960 },
  { label: "this gen's best", id: 113415 },
  { label: "required watching", id: 101922 },
  { label: "sports highs", id: 20464 },
  { label: "didn't expect to cry", id: 20665 },
  { label: "last 5 min energy", id: 11061 },
  { label: "just vibes", id: 21366 },
  { label: "art as feeling", id: 457 },
  { label: "still air", id: 4181 },
];

const MANGA_DISCOVER: DiscoverEntry[] = [
  { label: "the long road", id: 53390 },
  { label: "miles of story", id: 30013 },
  { label: "worth the length", id: 30007 },
  { label: "wrong for good reasons", id: 30003 },
  { label: "too far gone", id: 30008 },
  { label: "what you carry", id: 35230 },
  { label: "found family", id: 25 },
  { label: "chaotic bonds", id: 108556 },
  { label: "chosen crew", id: 80439 },
  { label: "slow burn", id: 30022 },
  { label: "the benchmark", id: 30002 },
  { label: "worth the slow burn", id: 30031 },
  { label: "brain rot art", id: 105778 },
  { label: "visceral art", id: 37799 },
  { label: "visually unhinged", id: 80471 },
  { label: "long run legends", id: 30051 },
  { label: "your parents read this", id: 30026 },
  { label: "peak volumes", id: 30025 },
  { label: "quiet devastation", id: 30021 },
  { label: "something is missing", id: 86133 },
  { label: "muted pain", id: 80011 },
  { label: "shonen staples", id: 13 },
  { label: "jump legends", id: 30011 },
  { label: "battle manga", id: 75989 },
  { label: "slow confession", id: 30100 },
  { label: "finally", id: 39201 },
  { label: "love arcs", id: 55215 },
  { label: "another world", id: 85934 },
  { label: "can't go home", id: 86243 },
  { label: "better world", id: 215 },
];

const DISCOVER_ENTRIES: Record<DiscoverMediaType, DiscoverEntry[]> = {
  ANIME: ANIME_DISCOVER,
  MANGA: MANGA_DISCOVER,
};

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
    await cacheAnimeCard(card);
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
