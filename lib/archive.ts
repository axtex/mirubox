import type { Anime } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ArchiveFolder = "all" | "watching" | "reading" | "ratings";

export const ARCHIVE_FOLDER_ORDER: ArchiveFolder[] = ["all", "watching", "reading", "ratings"];

export const ARCHIVE_FOLDER_META: Record<
  ArchiveFolder,
  { label: string; sub: string; title: string; href: string }
> = {
  all: {
    label: "ALL",
    sub: "LOGGED TITLES",
    title: "ALL TITLES",
    href: "/profile/archive/all",
  },
  watching: {
    label: "WATCHING",
    sub: "ANIME IN PROGRESS",
    title: "WATCHING",
    href: "/profile/archive/watching",
  },
  reading: {
    label: "READING",
    sub: "MANGA IN PROGRESS",
    title: "READING",
    href: "/profile/archive/reading",
  },
  ratings: {
    label: "RATING",
    sub: "AVG MAGNITUDE",
    title: "YOUR RATINGS",
    href: "/profile/archive/ratings",
  },
};

export function isArchiveFolder(value: string): value is ArchiveFolder {
  return ARCHIVE_FOLDER_ORDER.includes(value as ArchiveFolder);
}

export function mediaHref(anime: Pick<Anime, "id" | "type">): string {
  return anime.type === "MANGA" ? `/manga/${anime.id}` : `/anime/${anime.id}`;
}

export interface ArchiveCounts {
  all: number;
  watching: number;
  reading: number;
  ratingsCount: number;
  avgScore: string | null;
}

export async function getArchiveCounts(userId: string): Promise<ArchiveCounts> {
  const [watchlistEntries, ratings, watchingCount, readingCount, avgRating] = await Promise.all([
    prisma.watchlistEntry.findMany({ where: { userId }, select: { animeId: true } }),
    prisma.rating.findMany({ where: { userId }, select: { animeId: true } }),
    prisma.watchlistEntry.count({
      where: { userId, status: "WATCHING", anime: { type: "ANIME" } },
    }),
    prisma.watchlistEntry.count({
      where: { userId, status: "READING", anime: { type: "MANGA" } },
    }),
    prisma.rating.aggregate({ where: { userId }, _avg: { score: true }, _count: true }),
  ]);

  const watchlistIds = new Set(watchlistEntries.map((e) => e.animeId));
  const ratingOnlyCount = ratings.filter((r) => !watchlistIds.has(r.animeId)).length;

  return {
    all: watchlistEntries.length + ratingOnlyCount,
    watching: watchingCount,
    reading: readingCount,
    ratingsCount: avgRating._count,
    avgScore: avgRating._avg.score ? avgRating._avg.score.toFixed(1) : null,
  };
}

export type ArchiveItem =
  | {
      kind: "watchlist";
      anime: Anime;
      status: string;
      progress: number;
      userScore: number | null;
    }
  | {
      kind: "rating";
      anime: Anime;
      score: number;
    };

export async function getArchiveItems(userId: string, folder: ArchiveFolder): Promise<ArchiveItem[]> {
  if (folder === "watching") {
    const entries = await prisma.watchlistEntry.findMany({
      where: { userId, status: "WATCHING", anime: { type: "ANIME" } },
      include: { anime: true },
      orderBy: { updatedAt: "desc" },
    });
    const ratings = await prisma.rating.findMany({
      where: { userId, animeId: { in: entries.map((e) => e.animeId) } },
      select: { animeId: true, score: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.animeId, r.score]));
    return entries.map((e) => ({
      kind: "watchlist",
      anime: e.anime,
      status: e.status,
      progress: e.progress,
      userScore: ratingMap.get(e.animeId) ?? null,
    }));
  }

  if (folder === "reading") {
    const entries = await prisma.watchlistEntry.findMany({
      where: { userId, status: "READING", anime: { type: "MANGA" } },
      include: { anime: true },
      orderBy: { updatedAt: "desc" },
    });
    const ratings = await prisma.rating.findMany({
      where: { userId, animeId: { in: entries.map((e) => e.animeId) } },
      select: { animeId: true, score: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.animeId, r.score]));
    return entries.map((e) => ({
      kind: "watchlist",
      anime: e.anime,
      status: e.status,
      progress: e.progress,
      userScore: ratingMap.get(e.animeId) ?? null,
    }));
  }

  if (folder === "ratings") {
    const ratings = await prisma.rating.findMany({
      where: { userId },
      include: { anime: true },
      orderBy: { score: "desc" },
    });
    return ratings.map((r) => ({
      kind: "rating",
      anime: r.anime,
      score: r.score,
    }));
  }

  const [entries, ratings] = await Promise.all([
    prisma.watchlistEntry.findMany({
      where: { userId },
      include: { anime: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.rating.findMany({
      where: { userId },
      include: { anime: true },
    }),
  ]);

  const ratingMap = new Map(ratings.map((r) => [r.animeId, r.score]));
  const entryIds = new Set(entries.map((e) => e.animeId));
  const items: ArchiveItem[] = entries.map((e) => ({
    kind: "watchlist",
    anime: e.anime,
    status: e.status,
    progress: e.progress,
    userScore: ratingMap.get(e.animeId) ?? null,
  }));

  for (const r of ratings) {
    if (!entryIds.has(r.animeId)) {
      items.push({ kind: "rating", anime: r.anime, score: r.score });
    }
  }

  return items;
}
