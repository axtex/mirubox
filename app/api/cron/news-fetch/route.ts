import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTopNewsImages } from "@/lib/news-og-image";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== "development") {
    if (!cronSecret) {
      console.error("[news-fetch] CRON_SECRET not set");
      return Response.json({ error: "Misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await fetchAnnNews();
    return Response.json(result);
  } catch (err) {
    console.error("[news-fetch] failed:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

interface ParsedItem {
  title: string;
  url: string;
  excerpt: string | null;
  imageUrl: string | null;
  source: string;
  publishedAt: Date;
}

async function fetchAnnNews(): Promise<{
  fetched: number;
  saved: number;
  images: number;
}> {
  const ANN_RSS =
    "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us";

  const res = await fetch(ANN_RSS, {
    headers: {
      "User-Agent": "mirubox/1.0",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`ANN RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const items = parseRssItems(xml);

  if (!items.length) {
    return { fetched: 0, saved: 0, images: 0 };
  }

  let saved = 0;
  for (const item of items) {
    try {
      await prisma.newsItem.upsert({
        where: { url: item.url },
        create: item,
        update: {
          title: item.title,
          excerpt: item.excerpt,
          // Don't wipe scraped preview images when RSS has none
          ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        },
      });
      saved++;
    } catch (err) {
      console.error("[news-fetch] upsert failed:", item.url, err);
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.newsItem.deleteMany({
    where: {
      publishedAt: {
        lt: thirtyDaysAgo,
      },
    },
  });

  const images = await ensureTopNewsImages(3);

  console.log(
    `[news-fetch] fetched ${items.length} items, saved ${saved}, images ${images}`,
  );

  return {
    fetched: items.length,
    saved,
    images,
  };
}

function parseRssItems(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");

    if (!title || !link) continue;

    const imageUrl = extractImageFromHtml(description ?? "");
    const excerpt = description
      ? stripHtml(description).slice(0, 300).trim() || null
      : null;

    let publishedAt: Date;
    try {
      publishedAt = pubDate ? new Date(pubDate) : new Date();
      if (isNaN(publishedAt.getTime())) {
        publishedAt = new Date();
      }
    } catch {
      publishedAt = new Date();
    }

    items.push({
      title: stripHtml(title).trim(),
      url: link.trim(),
      excerpt,
      imageUrl,
      source: "ANN",
      publishedAt,
    });
  }

  return items.slice(0, 50);
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|` +
      `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const match = regex.exec(xml);
  if (!match) return null;
  return (match[1] ?? match[2])?.trim() ?? null;
}

function extractImageFromHtml(html: string): string | null {
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return match?.[1] ?? null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
