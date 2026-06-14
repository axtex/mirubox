import { prisma } from "@/lib/prisma";
import { generateEmbeddings, getAnimeEmbeddingText } from "@/lib/embeddings";

interface RawAnimeRow {
  id: number;
  title: string;
  titleEnglish: string | null;
  genres: string[];
  description: string | null;
  format: string | null;
  season: string | null;
  seasonYear: number | null;
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anime = await prisma.$queryRaw<RawAnimeRow[]>`
    SELECT id, title, "titleEnglish", genres,
      description, format, season, "seasonYear"
    FROM "Anime"
    WHERE embedding IS NULL
    LIMIT 50
  `;

  if (anime.length === 0) {
    return Response.json({ processed: 0, message: "All anime already embedded" });
  }

  const texts = anime.map(getAnimeEmbeddingText);
  const embeddings = await generateEmbeddings(texts);

  for (let i = 0; i < anime.length; i++) {
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRaw`
      UPDATE "Anime"
      SET embedding = ${vectorStr}::vector
      WHERE id = ${anime[i].id}
    `;
  }

  return Response.json({
    processed: anime.length,
    message: `Embedded ${anime.length} anime`,
  });
}
