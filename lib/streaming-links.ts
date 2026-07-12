export interface StreamingLink {
  site: string;
  url: string;
  color?: string | null;
  icon?: string | null;
}

interface SourceLink {
  url: string;
  site: string;
  color?: string | null;
  icon?: string | null;
  isDisabled?: boolean | null;
}

export const ANIME_STREAMING_SITES = new Set([
  "Crunchyroll",
  "Netflix",
  "HiDive",
  "Amazon Prime Video",
  "Funimation",
  "Disney+",
  "ADN",
  "Wakanim",
  "Bilibili",
  "YouTube",
]);

export const MANGA_READING_SITES = new Set([
  "MangaPlus",
  "Viz",
  "Comikey",
  "Tapas",
  "ComicWalker",
  "K Manga",
  "Official Site",
]);

const ANIME_SITE_PRIORITY: Record<string, number> = {
  Crunchyroll: 1,
  Netflix: 2,
  Funimation: 3,
  HiDive: 4,
  "Amazon Prime Video": 5,
  "Disney+": 6,
};

const MANGA_SITE_PRIORITY: Record<string, number> = {
  MangaPlus: 1,
  Viz: 2,
  "Official Site": 3,
  Comikey: 4,
  ComicWalker: 5,
  "K Manga": 6,
  Tapas: 7,
};

export function filterStreamingLinks(
  externalLinks: SourceLink[],
  mediaType: "ANIME" | "MANGA"
): StreamingLink[] {
  const sites = mediaType === "ANIME" ? ANIME_STREAMING_SITES : MANGA_READING_SITES;
  const priority = mediaType === "ANIME" ? ANIME_SITE_PRIORITY : MANGA_SITE_PRIORITY;

  return externalLinks
    .filter((link) => sites.has(link.site) && !link.isDisabled && link.url)
    .sort((a, b) => (priority[a.site] ?? 99) - (priority[b.site] ?? 99));
}

export function buildSearchFallbacks(
  title: string,
  mediaType: "ANIME" | "MANGA"
): StreamingLink[] {
  const encoded = encodeURIComponent(title);
  if (mediaType === "ANIME") {
    return [
      { site: "Crunchyroll", url: `https://www.crunchyroll.com/search?q=${encoded}` },
      { site: "Netflix", url: `https://www.netflix.com/search?q=${encoded}` },
    ];
  }
  return [
    { site: "MangaPlus", url: `https://mangaplus.shueisha.co.jp/search_result?keyword=${encoded}` },
    { site: "Viz", url: `https://www.viz.com/search?word=${encoded}` },
  ];
}
