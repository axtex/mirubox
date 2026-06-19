import { GraphQLClient, gql } from "graphql-request";
import type {
  AnimeCard,
  AnimeDetail,
  MediaPage,
} from "@/types/anilist";

const client = new GraphQLClient("https://graphql.anilist.co");

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
  }
`;

export async function getTrending(
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
  const data = await client.request<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
}

export async function getPopular(
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
  const data = await client.request<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
}

export async function getSeasonalAnime(
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
  const data = await client.request<{ Page: MediaPage }>(query, {
    season,
    year,
    page,
    perPage,
  });
  return data.Page;
}

export interface SearchFilters {
  genres?: string[];
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
  const data = await client.request<{ Page: MediaPage }>(gqlQuery, {
    search: query || undefined,
    type,
    genres: filters.genres?.length ? filters.genres : undefined,
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

export async function getMediaById(id: number): Promise<AnimeDetail | null> {
  const query = gql`
    ${ANIME_CARD_FRAGMENT}
    query GetMedia($id: Int) {
      Media(id: $id, isAdult: false) {
        ...AnimeCard
        description(asHtml: false)
        volumes
        characters(sort: ROLE, perPage: 8) {
          edges {
            node {
              id
              name {
                full
              }
              image {
                medium
              }
            }
            role
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
          type
          icon
          color
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
    const data = await client.request<{ Media: AnimeDetail | null }>(query, {
      id,
    });
    return data.Media;
  } catch {
    return null;
  }
}

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
  const data = await client.request<{ Page: MediaPage }>(query, {
    type,
    page,
    perPage,
  });
  return data.Page;
}

export function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season: string;
  if (month >= 1 && month <= 3) season = "WINTER";
  else if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else season = "FALL";
  return { season, year };
}

const SEASON_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

export function getNextSeason(): { season: string; year: number } {
  const { season, year } = getCurrentSeason();
  const idx = SEASON_ORDER.indexOf(season as (typeof SEASON_ORDER)[number]);
  const nextIdx = (idx + 1) % SEASON_ORDER.length;
  const nextYear = nextIdx === 0 ? year + 1 : year;
  return { season: SEASON_ORDER[nextIdx], year: nextYear };
}

export function formatSeasonLabel(season: string): string {
  return season[0].toUpperCase() + season.slice(1).toLowerCase();
}

export function getDisplayTitle(
  title: { romaji: string | null; english: string | null; native: string | null } | null
): string {
  if (!title) return "Unknown";
  return title.english ?? title.romaji ?? title.native ?? "Unknown";
}
