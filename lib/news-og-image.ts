import { prisma } from "@/lib/prisma";

const FETCH_TIMEOUT_MS = 8000;
const TOP_NEWS_COUNT = 3;

/** Scrape og:image / twitter:image from an article page. */
export async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent": "mirubox/1.0",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const html = await res.text();
    return extractOgImage(html);
  } catch (err) {
    console.error("[news-og] fetch failed:", articleUrl, err);
    return null;
  }
}

function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    const url = match?.[1]?.trim();
    if (url && /^https?:\/\//i.test(url)) return url;
  }

  return null;
}

/**
 * Ensure the latest N news items have preview images.
 * Scrapes og:image for any that are missing and persists to DB.
 */
export async function ensureTopNewsImages(
  count = TOP_NEWS_COUNT,
): Promise<number> {
  const top = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: count,
    select: { id: true, url: true, imageUrl: true },
  });

  const missing = top.filter((item) => !item.imageUrl);
  if (missing.length === 0) return 0;

  let updated = 0;

  await Promise.all(
    missing.map(async (item) => {
      const imageUrl = await fetchOgImage(item.url);
      if (!imageUrl) return;

      try {
        await prisma.newsItem.update({
          where: { id: item.id },
          data: { imageUrl },
        });
        updated++;
      } catch (err) {
        console.error("[news-og] update failed:", item.url, err);
      }
    }),
  );

  if (updated > 0) {
    console.log(`[news-og] filled ${updated}/${missing.length} top news images`);
  }

  return updated;
}
