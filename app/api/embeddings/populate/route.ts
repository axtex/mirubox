import { prisma } from "@/lib/prisma";
import { getPopular } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { generateEmbeddings, getAnimeEmbeddingText } from "@/lib/embeddings";

// Allow up to 5 minutes on Vercel Pro
export const maxDuration = 300;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function write(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      }

      let fetched = 0;
      let embedded = 0;
      let skipped = 0;
      let errors = 0;

      // ── Step 1: Fetch top 500 anime from AniList (25 pages × 20) ──────────
      const PAGES = 25;
      const PER_PAGE = 20;

      write({ status: "Fetching top anime from AniList…", progress: 0, total: PAGES * PER_PAGE });

      for (let page = 1; page <= PAGES; page++) {
        try {
          const result = await getPopular("ANIME", page, PER_PAGE);

          for (const media of result.media) {
            try {
              await cacheAnimeCard(media);
              fetched++;
            } catch {
              errors++;
            }
          }

          if (page % 5 === 0 || page === PAGES) {
            write({
              status: `Fetched page ${page}/${PAGES}`,
              progress: fetched,
              total: PAGES * PER_PAGE,
            });
          }

          // Respect AniList rate limit (90 req/min) — ~670ms between requests
          await sleep(700);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          write({ status: `Page ${page} error: ${msg}`, error: true });
          errors++;
          await sleep(1000);
        }
      }

      write({ status: `Fetched ${fetched} anime. Starting embeddings…`, fetched });

      const [{ count: alreadyEmbedded }] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "Anime" WHERE embedding IS NOT NULL
      `;
      const [{ count: pending }] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "Anime" WHERE embedding IS NULL
      `;

      write({
        status:
          pending === 0
            ? `All ${alreadyEmbedded} cached anime already have embeddings — nothing to generate.`
            : `Generating embeddings for ${pending} anime (${alreadyEmbedded} already embedded)…`,
        alreadyEmbedded,
        pending,
      });

      // ── Step 2: Generate embeddings in batches of 20 ────────────────────
      const BATCH = 20;
      let batchNum = 0;

      for (;;) {
        const unembed = await prisma.$queryRaw<RawAnimeRow[]>`
          SELECT id, title, "titleEnglish", genres,
            description, format, season, "seasonYear"
          FROM "Anime"
          WHERE embedding IS NULL
          LIMIT ${BATCH}
        `;

        if (unembed.length === 0) break;

        batchNum++;

        try {
          const texts = unembed.map(getAnimeEmbeddingText);
          const vectors = await generateEmbeddings(texts);

          for (let i = 0; i < unembed.length; i++) {
            const vectorStr = `[${vectors[i].join(",")}]`;
            await prisma.$executeRaw`
              UPDATE "Anime"
              SET embedding = ${vectorStr}::vector
              WHERE id = ${unembed[i].id}
            `;
            embedded++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          write({ status: `Embedding batch ${batchNum} error: ${msg}`, error: true });
          // Mark them as skipped so we don't loop forever on persistent failures
          for (const anime of unembed) {
            await prisma.$executeRaw`
              UPDATE "Anime" SET embedding = '[0]'::vector WHERE id = ${anime.id}
            `.catch(() => null);
            skipped++;
          }
          errors++;
        }

        if (batchNum % 3 === 0) {
          write({
            status: `Embedded ${embedded} anime…`,
            embedded,
            skipped,
          });
        }
      }

      const [{ count: totalEmbedded }] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "Anime" WHERE embedding IS NOT NULL
      `;

      const message =
        embedded === 0 && skipped === 0 && errors === 0
          ? `Done! ${totalEmbedded} anime already embedded, 0 newly embedded.`
          : `Done! ${embedded} newly embedded (${totalEmbedded} total with embeddings)${skipped ? `, ${skipped} skipped` : ""}${errors ? `, ${errors} errors` : ""}.`;

      write({
        done: true,
        fetched,
        embedded,
        alreadyEmbedded,
        totalEmbedded,
        skipped,
        errors,
        message,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
