import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  getPopularForEmbeddings,
  type EmbeddingsMediaFilter,
} from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { generateEmbeddings, getAnimeEmbeddingText, toVectorLiteral, EMBEDDING_DIMS } from "@/lib/embeddings";
import type { AnimeCard } from "@/types/anilist";

// Pro / fluid compute: allow long embedding runs (8000 anime + 2000 manga)
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

/** Quality floor: niche-but-beloved (score) OR has a real audience (popularity). */
function passesQualityFloor(media: AnimeCard): boolean {
  const score = media.averageScore ?? 0;
  const popularity = media.popularity ?? 0;
  return score >= 60 || popularity >= 5000;
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
      let filtered = 0;
      let errors = 0;
      const seenIds = new Set<number>();

      // ── Step 1: Fetch past AniList's 5000-entry page-depth cap ───────────
      // Each filtered query maxes out at 5000 rows. Union disjoint ranges by id.
      const PER_PAGE = 50; // AniList max — fewer requests per 5000-cap slice
      const MAX_PAGES = 100; // 100 * 50 = 5000 (hard ceiling per filter)
      const ANIME_TARGET = 8000;
      const MANGA_TARGET = 2000;

      // Pass A: audience floor. Pass B: high-score niche below that floor.
      const ANIME_PASSES: { label: string; filter: EmbeddingsMediaFilter }[] = [
        {
          label: "anime popularity≥5000",
          filter: { popularityGreater: 4999, sort: "POPULARITY_DESC" },
        },
        {
          label: "anime score≥60 & popularity<5000",
          filter: {
            averageScoreGreater: 59,
            popularityLesser: 5000,
            sort: "SCORE_DESC",
          },
        },
      ];
      const MANGA_PASSES: { label: string; filter: EmbeddingsMediaFilter }[] = [
        {
          label: "manga popularity≥5000",
          filter: { popularityGreater: 4999, sort: "POPULARITY_DESC" },
        },
        {
          label: "manga score≥60 & popularity<5000",
          filter: {
            averageScoreGreater: 59,
            popularityLesser: 5000,
            sort: "SCORE_DESC",
          },
        },
      ];

      async function fetchPass(
        type: "ANIME" | "MANGA",
        label: string,
        filter: EmbeddingsMediaFilter,
        target: number
      ): Promise<void> {
        if (seenIds.size >= target) return;

        write({
          status: `Fetching ${label}…`,
          progress: seenIds.size,
          total: target,
        });

        for (let page = 1; page <= MAX_PAGES; page++) {
          if (seenIds.size >= target) {
            write({
              status: `${label}: hit coverage target (${seenIds.size}/${target})`,
              progress: seenIds.size,
              total: target,
            });
            return;
          }

          try {
            const result = await getPopularForEmbeddings(type, page, PER_PAGE, filter);

            if (result.media.length === 0) {
              write({
                status: `${label} exhausted at page ${page}`,
                progress: seenIds.size,
                total: target,
              });
              return;
            }

            for (const media of result.media) {
              if (seenIds.has(media.id)) continue;
              if (!passesQualityFloor(media)) {
                filtered++;
                continue;
              }
              try {
                await cacheAnimeCard(media);
                seenIds.add(media.id);
                fetched++;
              } catch {
                errors++;
              }
            }

            if (page % 5 === 0 || page === MAX_PAGES || !result.pageInfo.hasNextPage) {
              write({
                status: `${label} page ${page}`,
                progress: seenIds.size,
                total: target,
                filtered,
              });
            }

            if (!result.pageInfo.hasNextPage) {
              write({
                status: `${label} complete (page ${page})`,
                progress: seenIds.size,
                total: target,
              });
              return;
            }

            await sleep(700);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            write({ status: `${label} page ${page} error: ${msg}`, error: true });
            errors++;
            if (msg.toLowerCase().includes("page depth")) {
              write({
                status: `${label} hit AniList 5000-entry cap — next pass will continue`,
                progress: seenIds.size,
                total: target,
              });
              return;
            }
            await sleep(1000);
          }
        }
      }

      for (const pass of ANIME_PASSES) {
        await fetchPass("ANIME", pass.label, pass.filter, ANIME_TARGET);
      }

      const animeCached = seenIds.size;
      write({
        status: `Anime pass done: ${animeCached} unique titles`,
        progress: animeCached,
        total: ANIME_TARGET,
      });

      // Manga IDs don't collide with anime on AniList; target is cumulative unique count.
      const mangaTarget = animeCached + MANGA_TARGET;
      for (const pass of MANGA_PASSES) {
        await fetchPass("MANGA", pass.label, pass.filter, mangaTarget);
      }

      write({
        status: `Fetched ${fetched} titles (${filtered} below quality floor, ${seenIds.size} unique cached). Starting embeddings…`,
        fetched,
        filtered,
        unique: seenIds.size,
      });

      let embedded = 0;
      let skipped = 0;

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
      const totalPending = pending;

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
          for (const anime of unembed) {
            await prisma.$executeRaw`
              UPDATE "Anime" SET embedding = ${ZERO_VECTOR}::vector WHERE id = ${anime.id}
            `.catch(() => null);
            skipped++;
          }
          errors++;
        }

        console.log(
          `Embedding batch ${batchNum}: ${embedded} / ${totalPending} titles`
        );

        if (batchNum % 3 === 0) {
          write({
            status: `Embedded ${embedded} titles…`,
            embedded,
            skipped,
          });
        }

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
        filtered,
        unique: seenIds.size,
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
