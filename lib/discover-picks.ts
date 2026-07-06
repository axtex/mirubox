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
  { label: "rural enchantment", id: 21858 },
  { label: "moonlit spells", id: 112609 },
  { label: "killer conscience", id: 101348 },
  { label: "moral rot", id: 101517 },
  { label: "guilty minds", id: 20755 },
  { label: "found family", id: 5114 },
  { label: "borrowed bonds", id: 154587 },
  { label: "home you choose", id: 106625 },
  { label: "slow burn", id: 21827 },
  { label: "aching patience", id: 100189 },
  { label: "lingered glances", id: 20954 },
  { label: "brain rot art", id: 7088 },
  { label: "unhinged visuals", id: 20349 },
  { label: "fever dream frames", id: 21708 },
  { label: "legendary s1s", id: 1 },
  { label: "perfect premieres", id: 9253 },
  { label: "season one gods", id: 16498 },
  { label: "quiet devastation", id: 30 },
  { label: "soft ruin", id: 23273 },
  { label: "gentle grief", id: 339 },
  { label: "modern classics", id: 170068 },
  { label: "current canon", id: 113415 },
  { label: "new essentials", id: 101922 },
  { label: "sports highs", id: 20464 },
  { label: "court drama", id: 20665 },
  { label: "game day rush", id: 11061 },
  { label: "atmospheric", id: 21366 },
  { label: "mood pieces", id: 457 },
  { label: "still air", id: 4181 },
];

const MANGA_DISCOVER: DiscoverEntry[] = [
  { label: "epic journeys", id: 53390 },
  { label: "long road", id: 30013 },
  { label: "odyssey ink", id: 87699 },
  { label: "killer conscience", id: 30003 },
  { label: "moral descent", id: 46470 },
  { label: "shadow guilt", id: 30072 },
  { label: "found family", id: 85877 },
  { label: "messy table", id: 108556 },
  { label: "chosen crew", id: 87789 },
  { label: "slow burn", id: 30022 },
  { label: "quiet yearning", id: 30002 },
  { label: "patient hearts", id: 34437 },
  { label: "brain rot art", id: 105778 },
  { label: "visceral lines", id: 114535 },
  { label: "chaotic panels", id: 137281 },
  { label: "legendary runs", id: 30051 },
  { label: "generational runs", id: 657 },
  { label: "peak volumes", id: 30038 },
  { label: "quiet devastation", id: 30021 },
  { label: "hollow ache", id: 104 },
  { label: "muted pain", id: 30059 },
  { label: "shonen staples", id: 30016 },
  { label: "jump legends", id: 30011 },
  { label: "battle manga", id: 30015 },
  { label: "romance peaks", id: 105152 },
  { label: "heart spikes", id: 115113 },
  { label: "love arcs", id: 104538 },
  { label: "isekai escape", id: 85934 },
  { label: "portal life", id: 86243 },
  { label: "other world", id: 101322 },
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
