import { cache } from "react";
import { ClientError, GraphQLClient, gql } from "graphql-request";
import type {
  AnimeCard,
  AnimeDetail,
  MediaPage,
} from "@/types/anilist";

const client = new GraphQLClient("https://graphql.anilist.co");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof ClientError && err.response.status === 429) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("Too Many");
}

function getRetryAfterMs(err: unknown): number | null {
  if (!(err instanceof ClientError)) return null;
  const retryAfter = err.response.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

const REQUEST_TIMEOUT_MS = 8000;
/** AniList allows ~30 req/min — pace requests to stay under the limit. */
const MIN_REQUEST_GAP_MS = 2100;

let requestChain: Promise<void> = Promise.resolve();
let lastRequestFinishedAt = 0;

function waitForRequestSlot(): Promise<void> {
  const slot = requestChain.then(async () => {
    const wait = lastRequestFinishedAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
  });
  requestChain = slot.catch(() => {});
  return slot;
}

async function anilistRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await waitForRequestSlot();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const result = await client.request<T>({ document: query, variables, signal: controller.signal });
      lastRequestFinishedAt = Date.now();
      return result;
    } catch (err) {
      lastRequestFinishedAt = Date.now();
      if (isRateLimitError(err) && attempt < maxAttempts - 1) {
        const retryAfter = getRetryAfterMs(err);
        await sleep(retryAfter ?? 2000 * (attempt + 1));
        continue;
      }
      if (controller.signal.aborted) {
        throw new Error("AniList request timed out", { cause: err });
      }
      throw new Error("Failed to fetch data from AniList", { cause: err });
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("AniList request failed");
}

const ANIME_CARD_FRAGMENT = gql`
  fragment AnimeCard on Media {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
    }
    bannerImage
    genres
    episodes
    chapters
    status
    season
    seasonYear
    averageScore
    popularity
    format
    type
    tags {
      name
      category
    }
    rankings {
      rank
      type
      allTime
    }
  }
`;

export const getTrending = cache(async function getTrending(
  type: "ANIME" | "MANGA" = "ANIME",
  page = 1,
  perPage = 20
): Promise<MediaPage> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetTrending($type: MediaType, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(sort: TRENDING_DESC, type: $type, isAdult: false) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
});

export const getPopular = cache(async function getPopular(
  type: "ANIME" | "MANGA" = "ANIME",
  page = 1,
  perPage = 20
): Promise<MediaPage> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetPopular($type: MediaType, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(sort: POPULARITY_DESC, type: $type, isAdult: false) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
});

export const getSeasonalAnime = cache(async function getSeasonalAnime(
  season: string,
  year: number,
  page = 1,
  perPage = 20
): Promise<MediaPage> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetSeasonal(
      $season: MediaSeason
      $year: Int
      $page: Int
      $perPage: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(
          season: $season
          seasonYear: $year
          sort: POPULARITY_DESC
          type: ANIME
          isAdult: false
        ) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(query, {
    season,
    year,
    page,
    perPage,
  });
  return data.Page;
});

export interface SearchFilters {
  genres?: string[];
  tags?: string[];
  status?: string;
  format?: string;
  year?: number;
  season?: string;
  sort?: string;
}

export async function searchMedia(
  query: string,
  type: "ANIME" | "MANGA" = "ANIME",
  filters: SearchFilters = {},
  page = 1,
  perPage = 20
): Promise<MediaPage> {
  const gqlQuery = gql`
    ${ANIME_CARD_FRAGMENT}
    query SearchMedia(
      $search: String
      $type: MediaType
      $genres: [String]
      $tags: [String]
      $status: MediaStatus
      $format: MediaFormat
      $year: Int
      $season: MediaSeason
      $sort: [MediaSort]
      $page: Int
      $perPage: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(
          search: $search
          type: $type
          genre_in: $genres
          tag_in: $tags
          status: $status
          format: $format
          seasonYear: $year
          season: $season
          sort: $sort
          isAdult: false
        ) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(gqlQuery, {
    search: query || undefined,
    type,
    genres: filters.genres?.length ? filters.genres : undefined,
    tags: filters.tags?.length ? filters.tags : undefined,
    status: filters.status || undefined,
    format: filters.format || undefined,
    year: filters.year || undefined,
    season: filters.season || undefined,
    sort: filters.sort ? [filters.sort] : query ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"],
    page,
    perPage,
  });
  return data.Page;
}

const MEDIA_CARD_BATCH_SIZE = 50;

export async function getMediaCardsByIds(ids: number[]): Promise<AnimeCard[]> {
  if (ids.length === 0) return [];

  const unique = [...new Set(ids)];
  const results: AnimeCard[] = [];
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetMediaCards($id_in: [Int], $perPage: Int) {
      Page(perPage: $perPage) {
        media(id_in: $id_in, isAdult: false) {
          ...AnimeCard
        }
      }
    }
  `;

  for (let i = 0; i < unique.length; i += MEDIA_CARD_BATCH_SIZE) {
    const chunk = unique.slice(i, i + MEDIA_CARD_BATCH_SIZE);
    const data = await anilistRequest<{ Page: { media: AnimeCard[] } }>(query, {
      id_in: chunk,
      perPage: chunk.length,
    });
    results.push(...data.Page.media);
  }

  return results;
}

export const getMediaById = cache(async (id: number): Promise<AnimeDetail | null> => {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetMedia($id: Int) {
      Media(id: $id, isAdult: false) {
        ...AnimeCard
        description(asHtml: false)
        volumes
        meanScore
        source
        duration
        characters(sort: ROLE, perPage: 25) {
          edges {
            node {
              id
              name {
                full
              }
              image {
                medium
                large
              }
            }
            role
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        relations {
          edges {
            node {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                extraLarge
              }
              format
              type
              status
            }
            relationType
          }
        }
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        externalLinks {
          id
          url
          site
          siteId
          type
          language
          icon
          color
          notes
          isDisabled
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        recommendations(perPage: 6, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              ...AnimeCard
            }
          }
        }
      }
    }
  `;
  try {
    const data = await anilistRequest<{ Media: AnimeDetail | null }>(query, {
      id,
    });
    return data.Media;
  } catch {
    return null;
  }
});

export async function getTopRated(
  type: "ANIME" | "MANGA" = "ANIME",
  page = 1,
  perPage = 20
): Promise<MediaPage> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetTopRated($type: MediaType, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(sort: SCORE_DESC, type: $type, isAdult: false, popularity_greater: 10000) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
}

export {
  getCurrentSeason,
  getNextSeason,
  formatSeasonLabel,
  type Season,
} from "@/lib/season";

export function getDisplayTitle(
  title: { romaji: string | null; english: string | null; native: string | null } | null
): string {
  if (!title) return "Unknown";
  return title.english ?? title.romaji ?? title.native ?? "Unknown";
}

/**
 * Splits off the last word of a title so it can be glued (via white-space: nowrap)
 * to a trailing inline element like a score pill — keeps that pair from ever
 * wrapping apart, so the pill is never left alone on its own line.
 */
export function splitLastWord(title: string): { leading: string; lastWord: string } {
  const idx = title.trimEnd().lastIndexOf(" ");
  if (idx === -1) return { leading: "", lastWord: title };
  return { leading: title.slice(0, idx + 1), lastWord: title.slice(idx + 1) };
}
