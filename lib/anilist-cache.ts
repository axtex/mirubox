import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import type { AnimeCard, AnimeDetail } from "@/types/anilist";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < CACHE_TTL_MS;
}

const DEMOGRAPHIC_TAGS = new Set(["SHOUNEN", "SHOUJO", "SEINEN", "JOSEI"]);

function demographicFromTags(tags: AnimeCard["tags"] | undefined): string | null {
  const tag = (tags ?? []).find((t) => t.category === "Demographic");
  const demographic = tag?.name.toUpperCase() ?? null;
  return demographic && DEMOGRAPHIC_TAGS.has(demographic) ? demographic : null;
}

function isTop100FromRankings(rankings: AnimeCard["rankings"] | undefined): boolean {
  return (rankings ?? []).some((r) => r.allTime && r.type === "RATED" && r.rank <= 100);
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
    demographic: demographicFromTags(media.tags),
    isTop100: isTop100FromRankings(media.rankings),
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

// Relations are only available on the full detail fetch — call this from anime/manga
// detail pages after fetching. Never clobbers the flag from a card-only refresh.
export async function cacheAnimeAdaptationFlag(media: AnimeDetail): Promise<void> {
  try {
    const hasAdaptation = media.relations.edges.some(
      (e) => e.relationType === "ADAPTATION" && e.node.type === "ANIME"
    );
    await prisma.anime.upsert({
      where: { id: media.id },
      create: { ...toDbAnime(media), hasAnimeAdaptation: hasAdaptation },
      update: { hasAnimeAdaptation: hasAdaptation },
    });
  } catch {
    // Silently skip if DB unavailable
  }
}

export async function cacheAnimeCard(media: AnimeCard): Promise<void> {
  try {
    const existing = await prisma.anime.findUnique({ where: { id: media.id } });
    const missingCounts =
      existing &&
      ((media.type === "MANGA" && existing.chapters == null && media.chapters != null) ||
        (media.type !== "MANGA" && existing.episodes == null && media.episodes != null));

    if (existing && isFresh(existing.cachedAt) && !missingCounts) return;

    await prisma.anime.upsert({
      where: { id: media.id },
      create: toDbAnime(media),
      update: toDbAnime(media),
    });
  } catch {
    // Silently skip DB caching if unavailable
  }
}
