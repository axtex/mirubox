import { prisma } from "@/lib/prisma";

interface RatedAnimeRow {
  embedding: number[];
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
      AND we.status IN ('COMPLETED', 'WATCHING')
  `;

  if (ratedAnime.length < 3) return null;

  const weights = ratedAnime.map((a) => Math.max(0.1, (Number(a.score) - 5) / 5 + 0.5));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const dims = 1536;
  const tasteVector = new Array<number>(dims).fill(0);

  for (let i = 0; i < ratedAnime.length; i++) {
    const w = weights[i] / totalWeight;
    const emb = ratedAnime[i].embedding as unknown as number[];
    for (let d = 0; d < dims; d++) {
      tasteVector[d] += emb[d] * w;
    }
  }

  return tasteVector;
}

export async function getRecommendations(userId: string, limit = 20) {
  const tasteVector = await getUserTasteVector(userId);
  if (!tasteVector) {
    return { recommendations: [], needsMoreData: true };
  }

  const watched = await prisma.watchlistEntry.findMany({
    where: { userId },
    select: { animeId: true },
  });
  const watchedIds = watched.map((w) => w.animeId);
  const vectorStr = `[${tasteVector.join(",")}]`;

  const recommendations = await prisma.$queryRaw<RecommendationRow[]>`
    SELECT
      id, title, "titleEnglish", "coverImage",
      genres, "averageScore", format, type,
      (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
    FROM "Anime"
    WHERE embedding IS NOT NULL
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
}
