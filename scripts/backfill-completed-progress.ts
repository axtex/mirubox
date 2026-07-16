/**
 * Fill progress to total for existing COMPLETED tracker entries.
 *
 * Dry run (default):
 *   npx tsx --env-file .env.local scripts/backfill-completed-progress.ts
 *
 * Apply:
 *   npx tsx --env-file .env.local scripts/backfill-completed-progress.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connStr = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

const apply = process.argv.includes("--apply");

function resolveTotal(entry: {
  total: number | null;
  mediaType: string;
  anime: { episodes: number | null; chapters: number | null };
}): number | null {
  if (entry.total != null && entry.total > 0) return entry.total;
  if (entry.mediaType === "MANGA") {
    return entry.anime.chapters != null && entry.anime.chapters > 0
      ? entry.anime.chapters
      : null;
  }
  return entry.anime.episodes != null && entry.anime.episodes > 0
    ? entry.anime.episodes
    : null;
}

async function main(): Promise<void> {
  const completed = await prisma.trackerEntry.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      progress: true,
      total: true,
      mediaType: true,
      animeId: true,
      anime: { select: { episodes: true, chapters: true, title: true } },
    },
  });

  const toFix: {
    id: string;
    animeId: number;
    title: string;
    from: number;
    to: number;
    setTotal: number | null;
  }[] = [];

  for (const entry of completed) {
    const total = resolveTotal(entry);
    if (total == null) continue;
    if (entry.progress >= total && entry.total === total) continue;
    if (entry.progress === total && entry.total == null) {
      // Progress already correct; just persist total if missing.
      toFix.push({
        id: entry.id,
        animeId: entry.animeId,
        title: entry.anime.title,
        from: entry.progress,
        to: total,
        setTotal: total,
      });
      continue;
    }
    if (entry.progress < total || entry.total !== total) {
      toFix.push({
        id: entry.id,
        animeId: entry.animeId,
        title: entry.anime.title,
        from: entry.progress,
        to: total,
        setTotal: total,
      });
    }
  }

  console.log(
    `Found ${completed.length} COMPLETED entries; ${toFix.length} need progress/total sync.`,
  );

  if (toFix.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const sample = toFix.slice(0, 15);
  for (const row of sample) {
    console.log(
      `  #${row.animeId} ${row.title}: ${row.from} → ${row.to}` +
        (row.setTotal != null ? ` (total=${row.setTotal})` : ""),
    );
  }
  if (toFix.length > sample.length) {
    console.log(`  …and ${toFix.length - sample.length} more`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    return;
  }

  let updated = 0;
  const batchSize = 100;
  for (let i = 0; i < toFix.length; i += batchSize) {
    const batch = toFix.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map((row) =>
        prisma.trackerEntry.update({
          where: { id: row.id },
          data: {
            progress: row.to,
            ...(row.setTotal != null ? { total: row.setTotal } : {}),
          },
        }),
      ),
    );
    updated += batch.length;
    console.log(`Updated ${updated}/${toFix.length}`);
  }

  console.log(`Done. Synced ${updated} COMPLETED entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
