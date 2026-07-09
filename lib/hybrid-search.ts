import { searchMedia } from "@/lib/anilist";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";

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
  /** Minimum cosine similarity for a semantic match to count. Below this is noise. Default 0.32. */
  threshold?: number;
  type?: "ANIME" | "MANGA";
}

const DEFAULT_LIMIT = 12;
const DEFAULT_THRESHOLD = 0.31;

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

  const [semantic, keyword] = await Promise.all([
    searchSemanticDB(query, limit, threshold, type).catch(() => [] as HybridResult[]),
    searchAniListKeyword(query, limit, type).catch(() => [] as HybridResult[]),
  ]);
  return mergeResults(semantic, keyword, limit);
}
