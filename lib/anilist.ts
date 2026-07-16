import { cache } from "react";
import { unstable_cache } from "next/cache";
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
        if (attempt < maxAttempts - 1) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        throw new Error("AniList request timed out", { cause: err });
      }
      // Surface GraphQL messages (e.g. page-depth cap) instead of a generic wrap
      if (err instanceof ClientError) {
        const gqlMsg = err.response.errors?.[0]?.message;
        if (gqlMsg) throw new Error(gqlMsg, { cause: err });
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

/**
 * Media for embedding population (uncached — long multi-page jobs).
 *
 * AniList caps each Page query at 5000 entries (page × perPage). To cover
 * more titles, call this multiple times with disjoint filter ranges
 * (e.g. popularity buckets, or score floor + popularity_lesser) and union by id.
 */
export interface EmbeddingsMediaFilter {
  popularityGreater?: number;
  popularityLesser?: number;
  averageScoreGreater?: number;
  sort?: "POPULARITY_DESC" | "SCORE_DESC";
}

export async function getPopularForEmbeddings(
  type: "ANIME" | "MANGA" = "ANIME",
  page = 1,
  perPage = 20,
  filter: EmbeddingsMediaFilter = { popularityGreater: 4999 }
): Promise<MediaPage> {
  const sort = filter.sort ?? "POPULARITY_DESC";
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetPopularForEmbeddings(
      $type: MediaType
      $page: Int
      $perPage: Int
      $sort: [MediaSort]
      $popularityGreater: Int
      $popularityLesser: Int
      $averageScoreGreater: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(
          sort: $sort
          type: $type
          isAdult: false
          popularity_greater: $popularityGreater
          popularity_lesser: $popularityLesser
          averageScore_greater: $averageScoreGreater
        ) {
          ...AnimeCard
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
    sort: [sort],
    popularityGreater: filter.popularityGreater,
    popularityLesser: filter.popularityLesser,
    averageScoreGreater: filter.averageScoreGreater,
  });
  return data.Page;
}

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

export interface HomePageMedia {
  trending: MediaPage;
  seasonal: MediaPage;
  upcoming: MediaPage;
  manga: MediaPage;
}

const EMPTY_HOME_PAGE: MediaPage = {
  pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
  media: [],
};

/** Live AniList fetch for home shelves (used by cron sync + cache fallback). */
export async function fetchHomePageMedia(
  season: string,
  year: number,
  nextSeason: string,
  nextYear: number,
): Promise<HomePageMedia> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query HomePageMedia(
      $season: MediaSeason
      $year: Int
      $nextSeason: MediaSeason
      $nextYear: Int
    ) {
      trending: Page(page: 1, perPage: 28) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...AnimeCard
        }
      }
      seasonal: Page(page: 1, perPage: 20) {
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
      upcoming: Page(page: 1, perPage: 20) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(
          season: $nextSeason
          seasonYear: $nextYear
          sort: POPULARITY_DESC
          type: ANIME
          isAdult: false
        ) {
          ...AnimeCard
        }
      }
      manga: Page(page: 1, perPage: 7) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(sort: POPULARITY_DESC, type: MANGA, isAdult: false) {
          ...AnimeCard
        }
      }
    }
  `;

  try {
    const data = await anilistRequest<{
      trending: MediaPage;
      seasonal: MediaPage;
      upcoming: MediaPage;
      manga: MediaPage;
    }>(query, { season, year, nextSeason, nextYear });
    return {
      trending: data.trending,
      seasonal: data.seasonal,
      upcoming: data.upcoming,
      manga: data.manga,
    };
  } catch (err) {
    console.error("Home page media fetch failed:", err);
    return {
      trending: EMPTY_HOME_PAGE,
      seasonal: EMPTY_HOME_PAGE,
      upcoming: EMPTY_HOME_PAGE,
      manga: EMPTY_HOME_PAGE,
    };
  }
}

/**
 * Single AniList round-trip for the home page (avoids the 2.1s serial gap × 4).
 * Cached across requests for 1 hour — prefer DB shelves on browse pages.
 */
export const getHomePageMedia = unstable_cache(
  fetchHomePageMedia,
  ["home-page-media"],
  { revalidate: 3600, tags: ["home-anilist"] },
);

export interface AnimeBrowseMedia {
  trending: MediaPage;
  seasonal: MediaPage;
  upcoming: MediaPage;
  topRated: MediaPage;
}

/** Live AniList fetch for `/anime` shelves. */
export async function fetchAnimeBrowseMedia(
  season: string,
  year: number,
  nextSeason: string,
  nextYear: number,
): Promise<AnimeBrowseMedia> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query AnimeBrowseMedia(
      $season: MediaSeason
      $year: Int
      $nextSeason: MediaSeason
      $nextYear: Int
    ) {
      trending: Page(page: 1, perPage: 20) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...AnimeCard
        }
      }
      seasonal: Page(page: 1, perPage: 20) {
        pageInfo { total currentPage lastPage hasNextPage }
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
      upcoming: Page(page: 1, perPage: 20) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(
          season: $nextSeason
          seasonYear: $nextYear
          sort: POPULARITY_DESC
          type: ANIME
          isAdult: false
        ) {
          ...AnimeCard
        }
      }
      topRated: Page(page: 1, perPage: 20) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: SCORE_DESC, type: ANIME, isAdult: false, popularity_greater: 10000) {
          ...AnimeCard
        }
      }
    }
  `;

  try {
    return await anilistRequest<AnimeBrowseMedia>(query, {
      season,
      year,
      nextSeason,
      nextYear,
    });
  } catch (err) {
    console.error("Anime browse media fetch failed:", err);
    return {
      trending: EMPTY_HOME_PAGE,
      seasonal: EMPTY_HOME_PAGE,
      upcoming: EMPTY_HOME_PAGE,
      topRated: EMPTY_HOME_PAGE,
    };
  }
}

/** Batched + hour-cached AniList payload for `/anime`. Prefer DB shelves. */
export const getAnimeBrowseMedia = unstable_cache(
  fetchAnimeBrowseMedia,
  ["anime-browse-media"],
  { revalidate: 3600, tags: ["anime-browse-anilist"] },
);

export interface MangaBrowseMedia {
  trending: MediaPage;
  publishing: MediaPage;
  allTime: MediaPage;
}

/** Live AniList fetch for `/manga` shelves. */
export async function fetchMangaBrowseMedia(): Promise<MangaBrowseMedia> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query MangaBrowseMedia {
      trending: Page(page: 1, perPage: 14) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: TRENDING_DESC, type: MANGA, isAdult: false) {
          ...AnimeCard
        }
      }
      publishing: Page(page: 1, perPage: 14) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(status: RELEASING, sort: POPULARITY_DESC, type: MANGA, isAdult: false) {
          ...AnimeCard
        }
      }
      allTime: Page(page: 1, perPage: 14) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
          ...AnimeCard
        }
      }
    }
  `;

  try {
    return await anilistRequest<MangaBrowseMedia>(query);
  } catch (err) {
    console.error("Manga browse media fetch failed:", err);
    return {
      trending: EMPTY_HOME_PAGE,
      publishing: EMPTY_HOME_PAGE,
      allTime: EMPTY_HOME_PAGE,
    };
  }
}

/** Batched + hour-cached AniList payload for `/manga`. Prefer DB shelves. */
export const getMangaBrowseMedia = unstable_cache(
  fetchMangaBrowseMedia,
  ["manga-browse-media"],
  { revalidate: 3600, tags: ["manga-browse-anilist"] },
);

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
const MEDIA_CHAPTER_BATCH_SIZE = 25;

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

/** Lean fetch for backfilling missing manga chapter counts. */
export async function getMediaChaptersByIds(
  ids: number[],
): Promise<{ id: number; chapters: number | null }[]> {
  if (ids.length === 0) return [];

  const unique = [...new Set(ids)];
  const results: { id: number; chapters: number | null }[] = [];
  const query = gql`
    query GetMediaChapters($id_in: [Int], $perPage: Int) {
      Page(perPage: $perPage) {
        media(id_in: $id_in, isAdult: false) {
          id
          chapters
        }
      }
    }
  `;

  for (let i = 0; i < unique.length; i += MEDIA_CHAPTER_BATCH_SIZE) {
    const chunk = unique.slice(i, i + MEDIA_CHAPTER_BATCH_SIZE);
    try {
      const data = await anilistRequest<{
        Page: { media: { id: number; chapters: number | null }[] };
      }>(query, {
        id_in: chunk,
        perPage: chunk.length,
      });
      results.push(...data.Page.media);
    } catch (err) {
      console.error("AniList chapter batch failed:", { count: chunk.length, err });
    }
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

export interface AiringMedia {
  id: number;
  status: string;
  episodes: number | null;
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
  } | null;
}

const GET_AIRING_DATA = `
  query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        status
        episodes
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  }
`;

/** Lightweight airing-status fetch for episode-drop notifications. Batches of 50. */
export async function getAiringData(mediaIds: number[]): Promise<AiringMedia[]> {
  if (mediaIds.length === 0) return [];

  const results: AiringMedia[] = [];

  for (let i = 0; i < mediaIds.length; i += 50) {
    const batch = mediaIds.slice(i, i + 50);
    try {
      const data = await anilistRequest<{ Page: { media: AiringMedia[] } }>(
        GET_AIRING_DATA,
        { ids: batch },
      );
      results.push(...(data?.Page?.media ?? []));
      if (i + 50 < mediaIds.length) {
        await sleep(1000);
      }
    } catch (err) {
      console.error("[getAiringData] batch failed:", err);
    }
  }

  return results;
}

export {
  getCurrentSeason,
  getNextSeason,
  formatSeasonLabel,
  type Season,
} from "@/lib/season";

export { getDisplayTitle, splitLastWord } from "@/lib/display-title";
