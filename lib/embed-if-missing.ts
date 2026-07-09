import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import type { AnimeDetail } from "@/types/anilist";

// Prevents redundant concurrent embedding calls when a title gets several
// simultaneous detail-page views before its first embedding finishes.
const currentlyEmbedding = new Set<number>();

/**
 * Fire-and-forget: embeds a detail-page's media if it isn't already embedded.
 * Grows semantic-search coverage organically as users browse, without needing
 * to predict ahead of time which titles matter.
 */
export async function embedIfMissing(media: AnimeDetail): Promise<void> {
  if (currentlyEmbedding.has(media.id)) return;
  if (!media.description) return;

  currentlyEmbedding.add(media.id);
  try {
    // Ensure a DB row exists before attaching an embedding — a detail page can be
    // the first time this title has ever been cached.
    await cacheAnimeCard(media);

    // `embedding` is an Unsupported pgvector column — not selectable via the
    // normal Prisma client, so check it with a raw query like the rest of the
    // embedding pipeline does.
    const pending = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Anime" WHERE id = ${media.id} AND embedding IS NULL
    `;
    if (pending.length === 0) return;

    const { generateEmbedding, getAnimeEmbeddingText } = await import("@/lib/embeddings");
    const text = getAnimeEmbeddingText({
      title: media.title.romaji ?? media.title.english ?? "Unknown",
      titleEnglish: media.title.english ?? null,
      genres: media.genres,
      description: media.description,
      format: media.format,
      season: media.season,
      seasonYear: media.seasonYear,
    });
    const embedding = await generateEmbedding(text);
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "Anime"
      SET embedding = ${vectorStr}::vector
      WHERE id = ${media.id}
    `;
  } catch (error) {
    console.error("Failed to embed on detail view:", media.id, error);
  } finally {
    currentlyEmbedding.delete(media.id);
  }
}
