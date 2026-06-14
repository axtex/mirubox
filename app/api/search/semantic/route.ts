import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";

interface SemanticResult {
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

export async function POST(req: Request) {
  const body = await req.json() as { query?: string; limit?: number };
  const query = body.query?.trim() ?? "";
  const limit = body.limit ?? 20;

  if (!query) {
    return Response.json({ results: [] });
  }

  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw<SemanticResult[]>`
    SELECT
      id, title, "titleEnglish", "coverImage",
      genres, "averageScore", format, type,
      1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM "Anime"
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> ${vectorStr}::vector) > 0.25
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return Response.json({ results });
}
