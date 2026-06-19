import { prisma } from "@/lib/prisma";
import { EMBEDDING_DIMS, parsePgVector, toVectorLiteral } from "@/lib/embeddings";

interface RatedAnimeRow {
  embedding: unknown;
  score: number;
}

interface RecommendationRow {
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

function isValidTasteVector(vector: number[]): boolean {
  return (
    vector.length === EMBEDDING_DIMS &&
    vector.every((n) => Number.isFinite(n))
  );
}

export async function getUserTasteVector(userId: string): Promise<number[] | null> {
  const ratedAnime = await prisma.$queryRaw<RatedAnimeRow[]>`
    SELECT
      a.embedding,
      COALESCE(r.score, 7) AS score
    FROM "WatchlistEntry" we
    JOIN "Anime" a ON a.id = we."animeId"
    LEFT JOIN "Rating" r
      ON r."animeId" = we."animeId"
      AND r."userId" = we."userId"
    WHERE we."userId" = ${userId}
      AND a.embedding IS NOT NULL
      AND vector_dims(a.embedding) = ${EMBEDDING_DIMS}
      AND we.status IN ('COMPLETED', 'IN_PROGRESS')
  `;

  const validRated = ratedAnime
    .map((row) => ({ score: Number(row.score), embedding: parsePgVector(row.embedding) }))
    .filter((row): row is { score: number; embedding: number[] } => row.embedding !== null);

  if (validRated.length < 3) return null;

  const weights = validRated.map((a) => Math.max(0.1, (a.score - 5) / 5 + 0.5));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return null;

  const tasteVector = new Array<number>(EMBEDDING_DIMS).fill(0);

  for (let i = 0; i < validRated.length; i++) {
    const w = weights[i] / totalWeight;
    const emb = validRated[i].embedding;
    for (let d = 0; d < EMBEDDING_DIMS; d++) {
      tasteVector[d] += emb[d] * w;
    }
  }

  return isValidTasteVector(tasteVector) ? tasteVector : null;
}

export async function getRecommendations(userId: string, limit = 20) {
  try {
    const tasteVector = await getUserTasteVector(userId);
    if (!tasteVector) {
      return { recommendations: [], needsMoreData: true };
    }

    const watched = await prisma.watchlistEntry.findMany({
      where: { userId },
      select: { animeId: true },
    });
    const watchedIds = watched.map((w) => w.animeId);
    const vectorStr = toVectorLiteral(tasteVector);

    const recommendations = await prisma.$queryRaw<RecommendationRow[]>`
      SELECT
        id, title, "titleEnglish", "coverImage",
        genres, "averageScore", format, type,
        (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
      FROM "Anime"
      WHERE embedding IS NOT NULL
        AND vector_dims(embedding) = ${EMBEDDING_DIMS}
        AND id != ALL(${watchedIds}::int[])
        AND (1 - (embedding <=> ${vectorStr}::vector)) > 0.3
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return {
      recommendations,
      needsMoreData: false,
      basedOn: watchedIds.length,
    };
  } catch (err) {
    console.error("[getRecommendations]", err);
    return { recommendations: [], needsMoreData: true };
  }
}
