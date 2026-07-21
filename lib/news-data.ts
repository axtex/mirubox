import { prisma } from "@/lib/prisma";
import { ensureTopNewsImages } from "@/lib/news-og-image";

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  imageUrl: string | null;
  source: string;
  publishedAt: Date;
}

export async function getNewsArticles(limit = 30): Promise<NewsArticle[]> {
  // Fill OG images for top headlines if missing (no-op when already set)
  await ensureTopNewsImages(3);

  return prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
