import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import type { AnimeCard, AnimeDetail } from "@/types/anilist";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < CACHE_TTL_MS;
}

function toDbAnime(media: AnimeCard | AnimeDetail) {
  return {
    id: media.id,
    title: media.title.romaji ?? media.title.english ?? "Unknown",
    titleEnglish: media.title.english ?? null,
    titleNative: media.title.native ?? null,
    description: "description" in media ? (media.description ?? null) : null,
    coverImage: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
    bannerImage: media.bannerImage ?? null,
    genres: media.genres ?? [],
    episodes: media.episodes ?? null,
    chapters: media.chapters ?? null,
    volumes: "volumes" in media ? (media.volumes ?? null) : null,
    status: media.status ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    averageScore: media.averageScore ?? null,
    popularity: media.popularity ?? null,
    format: media.format ?? null,
    type: media.type ?? "ANIME",
    cachedAt: new Date(),
  };
}

export async function checkAndGetAnime(id: number): Promise<AnimeDetail | null> {
  try {
    const cached = await prisma.anime.findUnique({ where: { id } });
    if (cached && isFresh(cached.cachedAt)) {
      // Return as a mock AnimeDetail — full details will be fetched if stale
      return null; // caller should use AniList directly for full details
    }

    const media = await getMediaById(id);
    if (!media) return null;

    await prisma.anime.upsert({
      where: { id },
      create: toDbAnime(media),
      update: toDbAnime(media),
    });

    return media;
  } catch {
    // DB unavailable — fall through to AniList
    return getMediaById(id);
  }
}

export async function cacheAnimeCard(media: AnimeCard): Promise<void> {
  try {
    const existing = await prisma.anime.findUnique({ where: { id: media.id } });
    if (existing && isFresh(existing.cachedAt)) return;

    await prisma.anime.upsert({
      where: { id: media.id },
      create: toDbAnime(media),
      update: toDbAnime(media),
    });
  } catch {
    // Silently skip DB caching if unavailable
  }
}
