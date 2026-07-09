import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPopular } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { generateEmbeddings, getAnimeEmbeddingText, toVectorLiteral, EMBEDDING_DIMS } from "@/lib/embeddings";

// 2000 anime + 500 manga takes longer than the old 500-anime job — allow up to 10 minutes on Vercel Pro
export const maxDuration = 600;

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
  const adminSecret = process.env.ADMIN_SECRET;

  if (!secret || !adminSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretBuf = Buffer.from(secret);
  const adminBuf = Buffer.from(adminSecret);

  const match =
    secretBuf.length === adminBuf.length &&
    timingSafeEqual(secretBuf, adminBuf);

  if (!match) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function write(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      }

      let fetched = 0;
      let errors = 0;

      // ── Step 1: Fetch top 2000 anime + top 500 manga from AniList ──────────
      const PER_PAGE = 20;
      const ANIME_PAGES = 100; // 100 * 20 = 2000
      const MANGA_PAGES = 25; //   25 * 20 =  500

      async function fetchAndCachePopular(type: "ANIME" | "MANGA", pages: number) {
        const total = pages * PER_PAGE;
        write({ status: `Fetching top ${type.toLowerCase()} from AniList…`, progress: 0, total });

        for (let page = 1; page <= pages; page++) {
          try {
            const result = await getPopular(type, page, PER_PAGE);

            for (const media of result.media) {
              try {
                await cacheAnimeCard(media);
                fetched++;
              } catch {
                errors++;
              }
            }

            if (page % 5 === 0 || page === pages) {
              write({
                status: `Fetched ${type.toLowerCase()} page ${page}/${pages}`,
                progress: fetched,
                total,
              });
            }

            // Respect AniList rate limit (90 req/min) — ~670ms between requests
            await sleep(700);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            write({ status: `${type} page ${page} error: ${msg}`, error: true });
            errors++;
            await sleep(1000);
          }
        }
      }

      await fetchAndCachePopular("ANIME", ANIME_PAGES);
      await fetchAndCachePopular("MANGA", MANGA_PAGES);

      let embedded = 0;
      let skipped = 0;

      write({ status: `Fetched ${fetched} titles. Starting embeddings…`, fetched });

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

      // ── Step 2: Generate embeddings in batches of 50 ────────────────────
      const BATCH = 50;
      // Column is a fixed vector(1536) — the skip marker must match that dimension
      // or the UPDATE itself fails and the row silently stays NULL, looping forever.
      const ZERO_VECTOR = toVectorLiteral(new Array(EMBEDDING_DIMS).fill(0));
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
              UPDATE "Anime" SET embedding = ${ZERO_VECTOR}::vector WHERE id = ${anime.id}
            `.catch(() => null);
            skipped++;
          }
          errors++;
        }

        if (batchNum % 3 === 0) {
          write({
            status: `Embedded ${embedded} titles…`,
            embedded,
            skipped,
          });
        }

        // Avoid bursting OpenAI's rate limit across ~50 batches
        await sleep(1000);
      }

      const [{ count: totalEmbedded }] = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "Anime" WHERE embedding IS NOT NULL
      `;

      const message =
        embedded === 0 && skipped === 0 && errors === 0
          ? `Done! ${totalEmbedded} titles already embedded, 0 newly embedded.`
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
