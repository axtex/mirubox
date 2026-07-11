import { searchMedia, getMediaCardsByIds } from "@/lib/anilist";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { findSearchDiscoverPrompt } from "@/lib/search-discover-prompts";
import { parseSimilarToQuery, searchSimilarToReference } from "@/lib/similar-to-search";
import { resolveDescriptor, searchDescriptorFilters } from "@/lib/descriptor-search";
import type { AnimeCard } from "@/types/anilist";

export type SearchSource = "semantic" | "anilist" | "both";

export interface HybridResult {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  type: string;
  similarity: number | null;
  source: SearchSource;
  _isFallback?: boolean;
}

interface DbRow {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  type: string;
  similarity: number;
}

export interface HybridSearchOptions {
  /** Max results returned after merging. Default 12. */
  limit?: number;
  /** Minimum cosine similarity for a semantic match to count. Below this is noise. Default 0.27. */
  threshold?: number;
  type?: "ANIME" | "MANGA";
}

const DEFAULT_LIMIT = 12;
const DEFAULT_THRESHOLD = 0.27;
const PROMPT_RELAXED_THRESHOLD = 0.2;

function cardToHybridResult(card: AnimeCard, similarity: number | null): HybridResult {
  return {
    id: card.id,
    title: card.title.romaji ?? card.title.english ?? "",
    titleEnglish: card.title.english ?? null,
    coverImage: card.coverImage.extraLarge ?? card.coverImage.large ?? null,
    genres: card.genres,
    averageScore: card.averageScore,
    format: card.format,
    type: card.type,
    similarity,
    source: "anilist",
  };
}

async function loadAnchorResult(
  id: number,
  type: "ANIME" | "MANGA",
): Promise<HybridResult | null> {
  try {
    const row = await prisma.anime.findUnique({ where: { id } });
    if (row && row.type === type) {
      return {
        id: row.id,
        title: row.title,
        titleEnglish: row.titleEnglish,
        coverImage: row.coverImage,
        genres: row.genres,
        averageScore: row.averageScore,
        format: row.format,
        type: row.type,
        similarity: 1,
        source: "anilist",
      };
    }
  } catch {
    /* DB unavailable */
  }

  const cards = await getMediaCardsByIds([id]);
  const card = cards.find((item) => item.type === type);
  return card ? cardToHybridResult(card, 1) : null;
}

function mergeWithAnchor(
  anchor: HybridResult,
  results: HybridResult[],
  limit: number,
): HybridResult[] {
  const map = new Map<number, HybridResult>();
  map.set(anchor.id, { ...anchor, similarity: 1, source: "anilist" });
  for (const result of results) {
    if (result.id === anchor.id) continue;
    map.set(result.id, result);
  }
  return [...map.values()]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
}

function appendResults(
  existing: HybridResult[],
  additional: HybridResult[],
  limit: number,
): HybridResult[] {
  const map = new Map<number, HybridResult>();
  for (const result of existing) map.set(result.id, result);
  for (const result of additional) {
    if (!map.has(result.id)) map.set(result.id, result);
  }
  return [...map.values()]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
}

function classifyQuery(query: string): {
  runSemantic: boolean;
  runKeyword: boolean;
} {
  const trimmed = query.trim();
  const words = trimmed.split(/\s+/);
  const wordCount = words.length;
  const charCount = trimmed.length;

  // Single short word — likely a title search or vague term, not a vibe query.
  if (wordCount === 1 && charCount <= 5) {
    return {
      runSemantic: false,
      runKeyword: true,
    };
  }

  // Multi-word or longer single word — run both.
  return {
    runSemantic: true,
    runKeyword: true,
  };
}

async function searchSemanticDB(
  query: string,
  limit: number,
  threshold: number,
  type: "ANIME" | "MANGA"
): Promise<HybridResult[]> {
  // Skip if we don't have enough embedded anime to be useful
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM "Anime" WHERE embedding IS NOT NULL AND type = ${type}
  `;
  if (Number(countResult[0].count) < 5) return [];

  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;

  const rows = await prisma.$queryRaw<DbRow[]>`
    SELECT
      id, title, "titleEnglish", "coverImage",
      genres, "averageScore", format, type,
      (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
    FROM "Anime"
    WHERE embedding IS NOT NULL
      AND type = ${type}
      AND (1 - (embedding <=> ${vectorStr}::vector)) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity), source: "semantic" as const }));
}

async function searchAniListKeyword(
  query: string,
  limit: number,
  type: "ANIME" | "MANGA"
): Promise<HybridResult[]> {
  const results = await searchMedia(query, type, {}, 1, limit);
  return results.media.map((m) => ({
    id: m.id,
    title: m.title.romaji ?? m.title.english ?? "",
    titleEnglish: m.title.english ?? null,
    coverImage: m.coverImage.extraLarge ?? m.coverImage.large ?? null,
    genres: m.genres,
    averageScore: m.averageScore,
    format: m.format,
    type: m.type,
    similarity: null,
    source: "anilist" as const,
  }));
}

function mergeResults(
  semantic: HybridResult[],
  keyword: HybridResult[],
  limit: number
): HybridResult[] {
  const map = new Map<number, HybridResult>();

  // Semantic results go in first (highest priority)
  for (const r of semantic) {
    map.set(r.id, r);
  }

  // AniList results: boost if also in semantic, add with default rank otherwise
  for (const r of keyword) {
    const existing = map.get(r.id);
    if (existing) {
      map.set(r.id, {
        ...existing,
        similarity: (existing.similarity ?? 0) + 0.1,
        source: "both",
      });
    } else {
      map.set(r.id, { ...r, similarity: 0.5 });
    }
  }

  return [...map.values()]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
}

export async function hybridSearch(
  query: string,
  opts: HybridSearchOptions = {}
): Promise<HybridResult[]> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const type = opts.type ?? "ANIME";

  const similarReference = parseSimilarToQuery(query);
  if (similarReference) {
    try {
      const similar = await searchSimilarToReference(similarReference, type, limit);
      if (similar && similar.results.length > 0) {
        return similar.results;
      }
    } catch (err) {
      console.error("Similar-to search failed:", err);
    }
  }

  const descriptor = resolveDescriptor(query);
  if (descriptor) {
    try {
      const [semanticResults, filterResults] = await Promise.all([
        searchSemanticDB(descriptor.semanticQuery, limit, threshold, type).catch((err) => {
          console.error("Descriptor semantic search failed:", err);
          return [] as HybridResult[];
        }),
        searchDescriptorFilters(descriptor, type, limit).catch((err) => {
          console.error("Descriptor filter search failed:", err);
          return [] as HybridResult[];
        }),
      ]);

      let results = mergeResults(semanticResults, filterResults, limit);

      if (results.length < limit) {
        const relaxed = await searchSemanticDB(
          descriptor.semanticQuery,
          limit,
          PROMPT_RELAXED_THRESHOLD,
          type,
        ).catch((err) => {
          console.error("Descriptor relaxed semantic search failed:", err);
          return [] as HybridResult[];
        });
        results = appendResults(results, relaxed, limit);
      }

      if (results.length > 0) return results;
    } catch (err) {
      console.error("Descriptor search failed:", err);
    }
  }

  const { runSemantic, runKeyword } = classifyQuery(query);

  let semantic: HybridResult[] = [];
  let keyword: HybridResult[] = [];

  const semanticPromise = runSemantic
    ? searchSemanticDB(query, limit, threshold, type).catch((err) => {
        console.error("Semantic search failed:", err);
        return [] as HybridResult[];
      })
    : Promise.resolve([] as HybridResult[]);

  const keywordPromise = runKeyword
    ? searchAniListKeyword(query, limit, type).catch((err) => {
        console.error("Keyword search failed:", err);
        return [] as HybridResult[];
      })
    : Promise.resolve([] as HybridResult[]);

  [semantic, keyword] = await Promise.all([semanticPromise, keywordPromise]);

  let results = mergeResults(semantic, keyword, limit);

  const curatedPrompt = similarReference ? null : findSearchDiscoverPrompt(query, type);
  if (curatedPrompt) {
    try {
      const anchor = await loadAnchorResult(curatedPrompt.id, type);
      if (anchor) {
        results = mergeWithAnchor(anchor, results, limit);
      }

      if (results.length < limit) {
        const relaxed = await searchSemanticDB(
          query,
          limit,
          PROMPT_RELAXED_THRESHOLD,
          type,
        ).catch((err) => {
          console.error("Relaxed semantic search failed:", err);
          return [] as HybridResult[];
        });
        results = appendResults(results, relaxed, limit);
      }
    } catch (err) {
      console.error("Curated prompt anchor failed:", err);
    }
  }

  // Last-resort typo tolerance: try partial match for single-word queries with no results
  if (
    results.length === 0 &&
    query.trim().split(/\s+/).length === 1 &&
    query.trim().length > 4
  ) {
    const partialQuery = query.trim().slice(0, 4);
    try {
      const partialResults = await searchAniListKeyword(partialQuery, limit, type);
      if (partialResults.length > 0) {
        return partialResults.slice(0, 6).map((r) => ({
          ...r,
          _isFallback: true,
        }));
      }
    } catch (err) {
      console.error("Partial keyword fallback failed:", err);
    }
  }

  if (results.length === 0 && curatedPrompt) {
    try {
      const anchor = await loadAnchorResult(curatedPrompt.id, type);
      if (anchor) return [anchor];
    } catch (err) {
      console.error("Curated prompt fallback failed:", err);
    }
  }

  return results;
}
