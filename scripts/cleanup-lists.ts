/**
 * Clean up incorrectly seeded list entries.
 * Run: npx tsx --env-file .env.local scripts/cleanup-lists.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connStr = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

async function remove(slug: string, ids: number[]): Promise<void> {
  const list = await prisma.list.findUnique({ where: { slug } });
  if (!list) return;
  const d = await prisma.listEntry.deleteMany({ where: { listId: list.id, mediaId: { in: ids } } });
  if (d.count > 0) console.log(`${slug}: removed ${d.count} entries`);
}

async function main() {
  // Adrenaline Rush: 97578=wrong title, 136=HxH 1999 (keep 11061=2011 version)
  await remove("adrenaline-rush", [97578, 136]);

  // Slow Burn: 188619=Natsume wrong ID (keep 4081), 120=Fruits Basket 2001 (keep 101974)
  await remove("slow-burn-masterpieces", [188619, 120]);

  // Late Night Mood: 367=wrong, 572=wrong
  await remove("late-night-mood", [367, 572]);

  // Films: 19815=wrong
  await remove("films-worth-your-evening", [19815]);

  // Start Here: 30276=wrong
  await remove("start-here", [30276]);

  // Read Before You Watch: many wrong manga IDs
  await remove("read-before-you-watch", [30013, 53390, 85877, 30022, 46470, 30072]);

  // Print final state
  const lists = await prisma.list.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { entries: true } } },
  });
  console.log("\nFinal state:");
  for (const l of lists) {
    console.log(`  ${l.slug}: ${l._count.entries} entries`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
