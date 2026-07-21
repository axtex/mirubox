/**
 * One-shot: npx tsx scripts/backfill-news-images.ts
 * Scrapes og:image for the top 3 news items missing previews.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main(): Promise<void> {
  const { ensureTopNewsImages } = await import("../lib/news-og-image");
  const { prisma } = await import("../lib/prisma");

  const n = await ensureTopNewsImages(3);
  const top = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { title: true, imageUrl: true },
  });
  console.log(JSON.stringify({ images: n, top }, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
