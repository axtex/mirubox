import type { Character, MediaRelation, StreamingLink as DbStreamingLink } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { embedIfMissing } from "@/lib/embed-if-missing";
import {
  CHARACTER_TTL_MS,
  RELATION_TTL_MS,
  STREAMING_TTL_MS,
  isStale,
} from "@/lib/cache-utils";
import {
  ANIME_STREAMING_SITES,
  MANGA_READING_SITES,
} from "@/lib/streaming-links";
import type {
  AnimeDetail,
  AnimeTitle,
  CharacterEdge,
  CoverImage,
  ExternalLink,
  RelationEdge,
} from "@/types/anilist";

const cachingCharacters = new Set<number>();
const cachingRelations = new Set<number>();
const cachingStreaming = new Set<number>();

const KEEP_RELATIONS = new Set([
  "SEQUEL",
  "PREQUEL",
  "ADAPTATION",
  "ALTERNATIVE_VERSION",
  "PARENT",
]);

export type MetadataMedia = {
  title: AnimeTitle;
  description: string | null;
  bannerImage: string | null;
  coverImage: CoverImage;
  seasonYear: number | null;
};

/** AniList first; DB row for title/description/images when AniList is down. */
export async function resolveMediaForMetadata(
  id: number
): Promise<MetadataMedia | null> {
  // Prefer DB so metadata never waits on AniList.
  const cached = await prisma.anime.findUnique({
    where: { id },
    select: {
      title: true,
      titleEnglish: true,
      titleNative: true,
      description: true,
      bannerImage: true,
      coverImage: true,
      seasonYear: true,
    },
  });
  if (cached?.title) {
    return {
      title: {
        romaji: cached.title,
        english: cached.titleEnglish,
        native: cached.titleNative,
      },
      description: cached.description,
      bannerImage: cached.bannerImage,
      coverImage: {
        large: cached.coverImage,
        extraLarge: cached.coverImage,
      },
      seasonYear: cached.seasonYear,
    };
  }

  const media = await getMediaById(id);
  if (!media) return null;
  return {
    title: media.title,
    description: media.description,
    bannerImage: media.bannerImage,
    coverImage: media.coverImage,
    seasonYear: media.seasonYear,
  };
}

export type AnimeWithDetailCache = {
  id: number;
  title: string;
  titleEnglish: string | null;
  titleNative: string | null;
  description: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  genres: string[];
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  format: string | null;
  source: string | null;
  duration: number | null;
  type: string;
  characters: Character[];
  relationsFrom: MediaRelation[];
  streamingLinks: DbStreamingLink[];
};

export function dbCharToEdge(char: Character): CharacterEdge {
  return {
    node: {
      id: char.id,
      name: { full: char.name },
      image: {
        large: char.image ?? null,
        medium: char.image ?? null,
      },
    },
    role: char.role,
    voiceActors: char.vaId
      ? [
          {
            id: char.vaId,
            name: { full: char.vaName ?? null },
            image: { large: char.vaImage ?? null },
          },
        ]
      : [],
  };
}

export function dbRelationToEdge(rel: MediaRelation): RelationEdge {
  return {
    relationType: rel.relationType,
    node: {
      id: rel.targetAnilistId,
      title: {
        romaji: rel.targetTitle,
        english: rel.targetTitleEng,
        native: null,
      },
      coverImage: {
        large: rel.targetCover,
        extraLarge: rel.targetCover,
      },
      format: rel.targetFormat,
      type: rel.targetType ?? "ANIME",
      status: rel.targetStatus,
    },
  };
}

export function dbStreamingToExternalLink(link: DbStreamingLink): ExternalLink {
  return {
    id: Number.parseInt(link.id, 10) || 0,
    url: link.url,
    site: link.site,
    siteId: null,
    type: null,
    language: null,
    icon: link.icon,
    color: link.color,
    notes: null,
    isDisabled: link.isDisabled,
  };
}

/** Reconstruct AnimeDetail from DB when AniList is unavailable. */
export function dbMediaToAnilistShape(cached: AnimeWithDetailCache): AnimeDetail {
  return {
    id: cached.id,
    title: {
      romaji: cached.title,
      english: cached.titleEnglish,
      native: cached.titleNative,
    },
    description: cached.description,
    coverImage: {
      large: cached.coverImage,
      extraLarge: cached.coverImage,
    },
    bannerImage: cached.bannerImage,
    genres: cached.genres,
    episodes: cached.episodes,
    chapters: cached.chapters,
    volumes: cached.volumes,
    status: cached.status,
    season: cached.season,
    seasonYear: cached.seasonYear,
    averageScore: cached.averageScore,
    meanScore: cached.meanScore,
    popularity: cached.popularity,
    format: cached.format,
    source: cached.source,
    duration: cached.duration,
    type: cached.type,
    tags: [],
    rankings: [],
    characters: {
      edges: cached.characters.map(dbCharToEdge),
    },
    relations: {
      edges: cached.relationsFrom.map(dbRelationToEdge),
    },
    externalLinks: cached.streamingLinks.map(dbStreamingToExternalLink),
    nextAiringEpisode: null,
    streamingEpisodes: [],
    recommendations: { nodes: [] },
    studios: { nodes: [] },
  };
}

// ── CHARACTERS + VA ──────────────────────────────────────────────────────────

export async function cacheCharactersIfMissing(
  mediaId: number,
  type: "ANIME" | "MANGA"
): Promise<void> {
  if (cachingCharacters.has(mediaId)) return;

  const existing = await prisma.anime.findUnique({
    where: { id: mediaId },
    select: { charactersCachedAt: true },
  });

  if (!isStale(existing?.charactersCachedAt, CHARACTER_TTL_MS)) return;

  cachingCharacters.add(mediaId);
  try {
    const media = await getMediaById(mediaId);
    if (!media) return;

    // FK requires an Anime row before Character inserts.
    await cacheAnimeCard(media);

    const edges = media.characters?.edges ?? [];

    await prisma.character.deleteMany({ where: { mediaId } });

    if (edges.length > 0) {
      await prisma.character.createMany({
        data: edges.map((edge, i) => {
          // getMediaById already requests voiceActors(language: JAPANESE)
          const va = type === "ANIME" ? (edge.voiceActors?.[0] ?? null) : null;
          return {
            id: edge.node.id,
            mediaId,
            name: edge.node.name?.full ?? "Unknown",
            image: edge.node.image?.large ?? edge.node.image?.medium ?? null,
            role: edge.role ?? "SUPPORTING",
            order: i,
            vaId: va?.id ?? null,
            vaName: va?.name?.full ?? null,
            vaImage: va?.image?.large ?? null,
          };
        }),
        skipDuplicates: true,
      });
    }

    await prisma.anime.update({
      where: { id: mediaId },
      data: { charactersCachedAt: new Date() },
    });
  } catch (err) {
    console.error("[cacheCharacters] mediaId", mediaId, err);
  } finally {
    cachingCharacters.delete(mediaId);
  }
}

// ── RELATIONS ────────────────────────────────────────────────────────────────

export async function cacheRelationsIfMissing(mediaId: number): Promise<void> {
  if (cachingRelations.has(mediaId)) return;

  const existing = await prisma.anime.findUnique({
    where: { id: mediaId },
    select: { relationsCachedAt: true },
  });

  if (!isStale(existing?.relationsCachedAt, RELATION_TTL_MS)) return;

  cachingRelations.add(mediaId);
  try {
    const media = await getMediaById(mediaId);
    if (!media) return;

    await cacheAnimeCard(media);

    const edges = media.relations?.edges ?? [];
    const filtered = edges.filter((e) => KEEP_RELATIONS.has(e.relationType));

    await prisma.mediaRelation.deleteMany({ where: { fromMediaId: mediaId } });

    if (filtered.length > 0) {
      await prisma.mediaRelation.createMany({
        data: filtered.map((edge) => ({
          id: `${mediaId}_${edge.node.id}_${edge.relationType}`,
          fromMediaId: mediaId,
          toMediaId: edge.node.id,
          targetAnilistId: edge.node.id,
          relationType: edge.relationType,
          targetTitle: edge.node.title?.romaji ?? null,
          targetTitleEng: edge.node.title?.english ?? null,
          targetCover:
            edge.node.coverImage?.extraLarge ?? edge.node.coverImage?.large ?? null,
          targetFormat: edge.node.format ?? null,
          targetType: edge.node.type ?? null,
          targetStatus: edge.node.status ?? null,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.anime.update({
      where: { id: mediaId },
      data: { relationsCachedAt: new Date() },
    });
  } catch (err) {
    console.error("[cacheRelations] mediaId", mediaId, err);
  } finally {
    cachingRelations.delete(mediaId);
  }
}

// ── STREAMING / READING LINKS ────────────────────────────────────────────────

export async function cacheStreamingIfMissing(
  mediaId: number,
  type: "ANIME" | "MANGA" = "ANIME"
): Promise<void> {
  if (cachingStreaming.has(mediaId)) return;

  const existing = await prisma.anime.findUnique({
    where: { id: mediaId },
    select: { streamingCachedAt: true },
  });

  if (!isStale(existing?.streamingCachedAt, STREAMING_TTL_MS)) return;

  cachingStreaming.add(mediaId);
  try {
    const media = await getMediaById(mediaId);
    if (!media?.externalLinks) return;

    await cacheAnimeCard(media);

    const sites = type === "ANIME" ? ANIME_STREAMING_SITES : MANGA_READING_SITES;
    const links = media.externalLinks.filter(
      (l) => sites.has(l.site) && !l.isDisabled && l.url
    );

    await prisma.streamingLink.deleteMany({ where: { mediaId } });

    if (links.length > 0) {
      await prisma.streamingLink.createMany({
        data: links.map((l) => ({
          id: String(l.id),
          mediaId,
          url: l.url,
          site: l.site,
          color: l.color ?? null,
          icon: l.icon ?? null,
          isDisabled: l.isDisabled ?? false,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.anime.update({
      where: { id: mediaId },
      data: { streamingCachedAt: new Date() },
    });
  } catch (err) {
    console.error("[cacheStreaming] mediaId", mediaId, err);
  } finally {
    cachingStreaming.delete(mediaId);
  }
}

const DETAIL_INCLUDE = {
  characters: { orderBy: { order: "asc" as const } },
  relationsFrom: true,
  streamingLinks: true,
} as const;

function scheduleDetailRefresh(mediaId: number, type: "ANIME" | "MANGA"): void {
  after(() => {
    void (async () => {
      try {
        const media = await getMediaById(mediaId);
        if (!media) return;
        await cacheAnimeCard(media, { force: true });
        await Promise.all([
          embedIfMissing(media),
          cacheCharactersIfMissing(mediaId, type),
          cacheRelationsIfMissing(mediaId),
          cacheStreamingIfMissing(mediaId, type),
        ]);
      } catch (err) {
        console.error(`[detail-refresh] ${type.toLowerCase()}/${mediaId}`, err);
      }
    })();
  });
}

/**
 * Serve detail pages from DB when present — never wait on AniList for a warm cache.
 * Cold titles still hit AniList once.
 */
export async function resolveMediaDetailForPage(
  mediaId: number,
  type: "ANIME" | "MANGA",
): Promise<AnimeDetail | null> {
  const cached = await prisma.anime.findUnique({
    where: { id: mediaId },
    include: DETAIL_INCLUDE,
  });

  if (cached?.title && cached.coverImage) {
    scheduleDetailRefresh(mediaId, type);
    return dbMediaToAnilistShape(cached);
  }

  const anilistMedia = await getMediaById(mediaId);
  if (!anilistMedia) {
    return cached ? dbMediaToAnilistShape(cached) : null;
  }

  await cacheAnimeCard(anilistMedia, { force: true });
  scheduleDetailRefresh(mediaId, type);
  return anilistMedia;
}
