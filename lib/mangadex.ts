import { prisma } from "@/lib/prisma";

const MANGADEX_BASE = "https://api.mangadex.org";

/** ~3 req/sec — under MangaDex's 5 req/sec limit */
const DELAY_MS = 300;

interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
  };
}

interface MangaDexChapter {
  id: string;
  attributes: {
    chapter: string | null;
    publishAt: string;
    translatedLanguage: string;
  };
}

async function mangaDexRequest(
  path: string,
  params: Record<string, string | string[]> = {},
): Promise<unknown> {
  const url = new URL(`${MANGADEX_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((val) => url.searchParams.append(k, val));
    } else {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "mirubox/1.0",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`MangaDex ${res.status}: ${path}`);
  }

  return res.json();
}

/**
 * Resolve a MangaDex UUID for an AniList manga title.
 * Prefer AniList external links / cached ID; fall back to title search.
 */
export async function resolveMangaDexId(
  anilistId: number,
  titleEnglish: string | null,
  titleRomaji: string | null,
): Promise<string | null> {
  const streamingLinks = await prisma.streamingLink.findMany({
    where: { mediaId: anilistId },
  });

  const mdLink = streamingLinks.find((l) =>
    l.url.toLowerCase().includes("mangadex.org"),
  );

  if (mdLink) {
    const match = mdLink.url.match(
      /mangadex\.org\/title\/([a-f0-9-]{36})/i,
    );
    if (match?.[1]) return match[1];
  }

  const cached = await prisma.anime.findUnique({
    where: { id: anilistId },
    select: { mangaDexId: true },
  });
  if (cached?.mangaDexId) return cached.mangaDexId;

  const searchTitle = titleEnglish ?? titleRomaji;
  if (!searchTitle) return null;

  try {
    await new Promise((r) => setTimeout(r, DELAY_MS));

    const data = (await mangaDexRequest("/manga", {
      title: searchTitle,
      limit: "5",
      "availableTranslatedLanguage[]": "en",
      "order[relevance]": "desc",
    })) as { data: MangaDexManga[] };

    if (!data?.data?.length) return null;

    const mangaDexId = data.data[0].id;

    await prisma.anime.update({
      where: { id: anilistId },
      data: { mangaDexId },
    });

    return mangaDexId;
  } catch (err) {
    console.error(
      "[resolveMangaDexId] search failed for",
      searchTitle,
      err,
    );
    return null;
  }
}

/** Latest English chapter number for a MangaDex title, or null if none. */
export async function getLatestChapter(
  mangaDexId: string,
): Promise<number | null> {
  try {
    await new Promise((r) => setTimeout(r, DELAY_MS));

    const data = (await mangaDexRequest("/chapter", {
      manga: mangaDexId,
      "translatedLanguage[]": "en",
      "order[chapter]": "desc",
      limit: "5",
      "contentRating[]": [
        "safe",
        "suggestive",
        "erotica",
        "pornographic",
      ],
    })) as { data: MangaDexChapter[] };

    if (!data?.data?.length) return null;

    const chapters = data.data
      .map((c) => parseFloat(c.attributes.chapter ?? ""))
      .filter((n) => !isNaN(n))
      .sort((a, b) => b - a);

    return chapters[0] ?? null;
  } catch (err) {
    console.error("[getLatestChapter] failed for", mangaDexId, err);
    return null;
  }
}

export interface LatestChapterData {
  chapter: number;
  /** When this chapter was published on MangaDex */
  publishAt: Date;
}

/** Latest English chapter number + publish date, or null if none. */
export async function getLatestChapterWithDate(
  mangaDexId: string,
): Promise<LatestChapterData | null> {
  try {
    await new Promise((r) => setTimeout(r, DELAY_MS));

    const data = (await mangaDexRequest("/chapter", {
      manga: mangaDexId,
      "translatedLanguage[]": "en",
      "order[chapter]": "desc",
      limit: "5",
      "contentRating[]": [
        "safe",
        "suggestive",
        "erotica",
        "pornographic",
      ],
    })) as { data: MangaDexChapter[] };

    if (!data?.data?.length) return null;

    const valid = data.data
      .filter(
        (c) =>
          c.attributes.chapter !== null &&
          !isNaN(parseFloat(c.attributes.chapter ?? "")),
      )
      .sort(
        (a, b) =>
          parseFloat(b.attributes.chapter ?? "0") -
          parseFloat(a.attributes.chapter ?? "0"),
      );

    if (!valid.length) return null;

    const latest = valid[0];
    return {
      chapter: parseFloat(latest.attributes.chapter ?? "0"),
      publishAt: new Date(latest.attributes.publishAt),
    };
  } catch (err) {
    console.error("[getLatestChapterWithDate] failed for", mangaDexId, err);
    return null;
  }
}
