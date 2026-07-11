import { prisma } from "@/lib/prisma";
import { getMediaCardsByIds } from "@/lib/anilist";
import { resolveTitleToMediaId } from "@/lib/resolve-title";

interface SimilarResult {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  type: string;
  similarity: number;
  source: "semantic";
}

interface SimilarDbRow {
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

const SIMILAR_THRESHOLD = 0.25;

const SIMILAR_TO_PATTERNS: RegExp[] = [
  /^(?:show|shows|anime|manga|titles?)\s+like\s+(.+)$/i,
  /^something\s+like\s+(.+)$/i,
  /^similar\s+to\s+(.+)$/i,
  /^like\s+(.+)$/i,
];

export function parseSimilarToQuery(query: string): string | null {
  const trimmed = query.trim();
  for (const pattern of SIMILAR_TO_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

async function searchSimilarByEmbedding(
  mediaId: number,
  type: "ANIME" | "MANGA",
  limit: number,
): Promise<SimilarResult[]> {
  const rows = await prisma.$queryRaw<SimilarDbRow[]>`
    SELECT
      a.id, a.title, a."titleEnglish", a."coverImage",
      a.genres, a."averageScore", a.format, a.type,
      (1 - (a.embedding <=> ref.embedding)) AS similarity
    FROM "Anime" a
    CROSS JOIN (
      SELECT embedding FROM "Anime" WHERE id = ${mediaId} AND embedding IS NOT NULL
    ) ref
    WHERE a.embedding IS NOT NULL
      AND a.type = ${type}
      AND a.id != ${mediaId}
      AND (1 - (a.embedding <=> ref.embedding)) > ${SIMILAR_THRESHOLD}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
    source: "semantic" as const,
  }));
}

async function searchSimilarByGenres(
  mediaId: number,
  genres: string[],
  type: "ANIME" | "MANGA",
  limit: number,
): Promise<SimilarResult[]> {
  if (genres.length === 0) return [];

  const rows = await prisma.anime.findMany({
    where: {
      type,
      id: { not: mediaId },
      genres: { hasSome: genres },
    },
    orderBy: { popularity: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      titleEnglish: true,
      coverImage: true,
      genres: true,
      averageScore: true,
      format: true,
      type: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    similarity: 0.4,
    source: "semantic" as const,
  }));
}

async function loadReferenceMeta(
  mediaId: number,
  type: "ANIME" | "MANGA",
): Promise<{ title: string; genres: string[] } | null> {
  try {
    const row = await prisma.anime.findUnique({
      where: { id: mediaId },
      select: { title: true, titleEnglish: true, genres: true, type: true },
    });
    if (row && row.type === type) {
      return {
        title: row.titleEnglish ?? row.title,
        genres: row.genres,
      };
    }
  } catch {
    /* DB unavailable */
  }

  const cards = await getMediaCardsByIds([mediaId]);
  const card = cards.find((item) => item.type === type);
  if (!card) return null;

  return {
    title: card.title.english ?? card.title.romaji ?? "",
    genres: card.genres,
  };
}

export interface SimilarToSearchResult {
  results: SimilarResult[];
  referenceTitle: string;
}

export async function searchSimilarToReference(
  reference: string,
  type: "ANIME" | "MANGA",
  limit: number,
): Promise<SimilarToSearchResult | null> {
  const mediaId = await resolveTitleToMediaId(reference, type);
  if (!mediaId) return null;

  const meta = await loadReferenceMeta(mediaId, type);
  const referenceTitle = meta?.title ?? reference;

  let results: SimilarResult[] = [];
  try {
    results = await searchSimilarByEmbedding(mediaId, type, limit);
  } catch (err) {
    console.error("Similar-by-embedding search failed:", err);
  }

  if (results.length < limit && meta?.genres.length) {
    try {
      const genreResults = await searchSimilarByGenres(mediaId, meta.genres, type, limit);
      const seen = new Set(results.map((r) => r.id));
      for (const row of genreResults) {
        if (seen.has(row.id)) continue;
        results.push(row);
        if (results.length >= limit) break;
      }
    } catch (err) {
      console.error("Similar-by-genre search failed:", err);
    }
  }

  return { results: results.slice(0, limit), referenceTitle };
}
