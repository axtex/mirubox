import type { Character, MediaRelation, StreamingLink as DbStreamingLink } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMediaById, getAiringData } from "@/lib/anilist";
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
  AnimeCard,
  AnimeDetail,
  AnimeTitle,
  CharacterEdge,
  CoverImage,
  ExternalLink,
  RelationEdge,
} from "@/types/anilist";

const RECOMMENDATION_TYPE = "RECOMMENDATION";

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
  airingStatus?: string | null;
  nextAiringEp?: number | null;
  nextAiringAt?: number | null;
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

function dbRelationToAnimeCard(rel: MediaRelation): AnimeCard {
  return {
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
    bannerImage: null,
    genres: [],
    episodes: null,
    chapters: null,
    status: rel.targetStatus,
    season: null,
    seasonYear: null,
    averageScore: null,
    popularity: null,
    format: rel.targetFormat,
    type: rel.targetType ?? "ANIME",
    tags: [],
    rankings: [],
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
    status: cached.airingStatus ?? cached.status,
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
      edges: cached.relationsFrom
        .filter((r) => r.relationType !== RECOMMENDATION_TYPE)
        .map(dbRelationToEdge),
    },
    externalLinks: cached.streamingLinks.map(dbStreamingToExternalLink),
    nextAiringEpisode:
      cached.nextAiringEp != null && cached.nextAiringAt != null
        ? { episode: cached.nextAiringEp, airingAt: cached.nextAiringAt }
        : null,
    streamingEpisodes: [],
    recommendations: {
      nodes: cached.relationsFrom
        .filter((r) => r.relationType === RECOMMENDATION_TYPE)
        .map((r) => ({ mediaRecommendation: dbRelationToAnimeCard(r) })),
    },
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

  const recCount = await prisma.mediaRelation.count({
    where: { fromMediaId: mediaId, relationType: RECOMMENDATION_TYPE },
  });

  // Re-fetch when TTL expired OR recommendations were never cached (older rows).
  if (!isStale(existing?.relationsCachedAt, RELATION_TTL_MS) && recCount > 0) return;

  cachingRelations.add(mediaId);
  try {
    const media = await getMediaById(mediaId);
    if (!media) return;

    await cacheAnimeCard(media);

    const edges = media.relations?.edges ?? [];
    const filtered = edges.filter((e) => KEEP_RELATIONS.has(e.relationType));
    const recNodes = (media.recommendations?.nodes ?? [])
      .map((n) => n.mediaRecommendation)
      .filter((m): m is AnimeCard => m != null)
      .slice(0, 6);

    await prisma.mediaRelation.deleteMany({ where: { fromMediaId: mediaId } });

    const rows = [
      ...filtered.map((edge) => ({
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
      ...recNodes.map((rec) => ({
        id: `${mediaId}_${rec.id}_${RECOMMENDATION_TYPE}`,
        fromMediaId: mediaId,
        toMediaId: rec.id,
        targetAnilistId: rec.id,
        relationType: RECOMMENDATION_TYPE,
        targetTitle: rec.title?.romaji ?? null,
        targetTitleEng: rec.title?.english ?? null,
        targetCover: rec.coverImage?.extraLarge ?? rec.coverImage?.large ?? null,
        targetFormat: rec.format ?? null,
        targetType: rec.type ?? null,
        targetStatus: rec.status ?? null,
      })),
    ];

    if (rows.length > 0) {
      await prisma.mediaRelation.createMany({
        data: rows,
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
 * Cold titles still hit AniList once. RELEASING anime missing airing data get a
 * lightweight next-episode fetch so the sidebar countdown can render.
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
    let media = dbMediaToAnilistShape(cached);

    // Older cache rows never stored recommendations — fill once from AniList.
    if (media.recommendations.nodes.length === 0) {
      try {
        const fresh = await getMediaById(mediaId);
        if (fresh?.recommendations?.nodes?.length) {
          media = { ...media, recommendations: fresh.recommendations };
        }
      } catch (err) {
        console.error(`[recs-fill] ${type.toLowerCase()}/${mediaId}`, err);
      }
    }

    const looksReleasing =
      type === "ANIME" &&
      (cached.status === "RELEASING" || cached.airingStatus === "RELEASING");
    if (looksReleasing && media.nextAiringEpisode == null) {
      try {
        const [airing] = await getAiringData([mediaId]);
        if (airing) {
          media = {
            ...media,
            status: airing.status ?? media.status,
            episodes: airing.episodes ?? media.episodes,
            nextAiringEpisode: airing.nextAiringEpisode,
          };
          void prisma.anime
            .update({
              where: { id: mediaId },
              data: {
                airingStatus: airing.status,
                nextAiringEp: airing.nextAiringEpisode?.episode ?? null,
                nextAiringAt: airing.nextAiringEpisode?.airingAt ?? null,
                ...(airing.episodes != null ? { episodes: airing.episodes } : {}),
              },
            })
            .catch(() => undefined);
        }
      } catch (err) {
        console.error(`[airing-fill] anime/${mediaId}`, err);
      }
    }

    return media;
  }

  const anilistMedia = await getMediaById(mediaId);
  if (!anilistMedia) {
    return cached ? dbMediaToAnilistShape(cached) : null;
  }

  await cacheAnimeCard(anilistMedia, { force: true });
  scheduleDetailRefresh(mediaId, type);
  return anilistMedia;
}
