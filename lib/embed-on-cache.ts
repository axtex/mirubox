import { prisma } from "@/lib/prisma";

export async function embedAnimeIfNeeded(animeId: number): Promise<void> {
  try {
    const result = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Anime"
      WHERE id = ${animeId}
        AND embedding IS NULL
    `;

    if (result.length === 0) return;

    const anime = await prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) return;

    const { generateEmbedding, getAnimeEmbeddingText } = await import("@/lib/embeddings");
    const text = getAnimeEmbeddingText(anime);
    const embedding = await generateEmbedding(text);
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "Anime"
      SET embedding = ${vectorStr}::vector
      WHERE id = ${animeId}
    `;
  } catch (error) {
    console.error("Failed to embed anime:", animeId, error);
    // Don't throw — background work
  }
}
