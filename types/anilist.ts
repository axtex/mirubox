export interface AnimeTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface CoverImage {
  large: string | null;
  extraLarge: string | null;
}

export interface MediaTag {
  name: string;
  category: string | null;
}

export interface MediaRanking {
  rank: number;
  type: string;
  allTime: boolean | null;
}

export interface AnimeCard {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
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
  tags: MediaTag[];
  rankings: MediaRanking[];
}

export interface VoiceActor {
  id: number;
  name: { full: string | null };
  image: { large: string | null };
}

export interface Character {
  id: number;
  name: { full: string | null };
  image: { medium: string | null; large: string | null };
}

export interface CharacterEdge {
  node: Character;
  role: string;
  voiceActors: VoiceActor[];
}

export interface Studio {
  id: number;
  name: string;
}

export interface Relation {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  format: string | null;
  type: string;
  status: string | null;
}

export interface RelationEdge {
  node: Relation;
  relationType: string;
}

export interface StreamingEpisode {
  title: string | null;
  thumbnail: string | null;
  url: string | null;
  site: string | null;
}

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  type: string | null;
  icon: string | null;
  color: string | null;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
}

export interface AnimeDetail extends AnimeCard {
  description: string | null;
  volumes: number | null;
  meanScore: number | null;
  source: string | null;
  duration: number | null;
  characters: {
    edges: CharacterEdge[];
  };
  relations: {
    edges: RelationEdge[];
  };
  studios: {
    nodes: Studio[];
  };
  streamingEpisodes: StreamingEpisode[];
  externalLinks: ExternalLink[];
  nextAiringEpisode: NextAiringEpisode | null;
  recommendations: {
    nodes: Array<{
      mediaRecommendation: AnimeCard | null;
    }>;
  };
}

export interface PageInfo {
  total: number | null;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface MediaPage {
  pageInfo: PageInfo;
  media: AnimeCard[];
}
