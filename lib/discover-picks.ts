import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import type { AnimeCard } from "@/types/anilist";

export interface GenreTile {
  genre: string;
  descriptor: string;
  tint: string;
  href: string;
}

export interface PoolData {
  label: string;
  anime: AnimeCard[];
}

const GENRE_POOL: GenreTile[] = [
  { genre: "Psychological", descriptor: "Dark, twisty, stays with you",     tint: "rgba(100,120,180,0.12)", href: "/search?genre=Psychological&mode=browse" },
  { genre: "Fantasy",       descriptor: "Vast worlds, ancient magic",       tint: "rgba(140,100,200,0.12)", href: "/search?genre=Fantasy&mode=browse"       },
  { genre: "Romance",       descriptor: "Tender moments, aching tension",   tint: "rgba(200,80,100,0.10)",  href: "/search?genre=Romance&mode=browse"       },
  { genre: "Action",        descriptor: "Kinetic. High-stakes. Legendary.", tint: "rgba(232,23,63,0.10)",   href: "/search?genre=Action&mode=browse"        },
  { genre: "Slice of Life", descriptor: "Quiet, warm, deeply human",        tint: "rgba(180,160,100,0.10)", href: "/search?genre=Slice+of+Life&mode=browse" },
  { genre: "Thriller",      descriptor: "Paranoia, twists, can't look away",tint: "rgba(60,80,100,0.15)",   href: "/search?genre=Thriller&mode=browse"      },
];

const ANIME_POOLS: Record<string, { label: string; ids: number[] }> = {
  A: { label: "cozy witches",      ids: [431, 21858, 112609]  },
  B: { label: "killer conscience", ids: [101348, 101517, 20755] },
  C: { label: "found family",      ids: [5114, 154587, 106625] },
  D: { label: "slow burn",         ids: [21827, 100189, 20954] },
  E: { label: "brain rot art",     ids: [7088, 20349, 21708]  },
  F: { label: "legendary s1s",     ids: [1, 9253, 16498]      },
  G: { label: "quiet devastation", ids: [30, 23273, 339]      },
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

async function fetchOne(id: number): Promise<AnimeCard | null> {
  try {
    const cached = await prisma.anime.findUnique({ where: { id } });
    if (cached) return dbRowToAnimeCard(cached);
  } catch { /* DB unavailable */ }

  const media = await getMediaById(id);
  if (!media) return null;

  try {
    await prisma.anime.upsert({
      where: { id },
      create: {
        id: media.id,
        title: media.title.romaji ?? media.title.english ?? "Unknown",
        titleEnglish: media.title.english ?? null,
        titleNative: media.title.native ?? null,
        description: media.description ?? null,
        coverImage: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
        bannerImage: media.bannerImage ?? null,
        genres: media.genres ?? [],
        episodes: media.episodes ?? null,
        chapters: media.chapters ?? null,
        volumes: media.volumes ?? null,
        status: media.status ?? null,
        season: media.season ?? null,
        seasonYear: media.seasonYear ?? null,
        averageScore: media.averageScore ?? null,
        popularity: media.popularity ?? null,
        format: media.format ?? null,
        type: media.type ?? "ANIME",
        cachedAt: new Date(),
      },
      update: {
        title: media.title.romaji ?? media.title.english ?? "Unknown",
        titleEnglish: media.title.english ?? null,
        coverImage: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
        bannerImage: media.bannerImage ?? null,
        genres: media.genres ?? [],
        averageScore: media.averageScore ?? null,
        cachedAt: new Date(),
      },
    });
  } catch { /* Silently skip */ }

  return media;
}

export async function fetchAllPools(): Promise<Record<string, PoolData>> {
  const out: Record<string, PoolData> = {};

  await Promise.all(
    Object.entries(ANIME_POOLS).map(async ([key, pool]) => {
      const results = await Promise.all(pool.ids.map(fetchOne));
      const valid = results.filter((r): r is AnimeCard => r !== null);
      if (valid.length >= 1) {
        out[key] = { label: pool.label, anime: valid };
      }
    })
  );

  return out;
}
