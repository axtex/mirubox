import { prisma } from "@/lib/prisma";

export interface UpcomingEpisode {
  animeId: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  nextEp: number;
  /** Converted from Unix seconds */
  airingAt: Date;
  userProgress: number;
}

export interface RecentRelease {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  /** Episode or chapter number */
  releaseNumber: number;
  releasedAt: Date;
  userProgress: number;
}

/** @deprecated Use RecentRelease / getRecentReleases */
export type RecentChapter = RecentRelease;

export async function getUpcomingEpisodes(
  userId: string,
): Promise<UpcomingEpisode[]> {
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60;

  const entries = await prisma.trackerEntry.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
      mediaType: "ANIME",
      anime: {
        nextAiringAt: {
          gt: now,
          lte: sevenDaysFromNow,
        },
      },
    },
    include: {
      anime: {
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          nextAiringEp: true,
          nextAiringAt: true,
        },
      },
    },
    orderBy: {
      anime: {
        nextAiringAt: "asc",
      },
    },
  });

  return entries
    .filter((e) => e.anime.nextAiringAt !== null && e.anime.nextAiringEp !== null)
    .map((e) => ({
      animeId: e.anime.id,
      title: e.anime.title,
      titleEnglish: e.anime.titleEnglish,
      coverImage: e.anime.coverImage,
      nextEp: e.anime.nextAiringEp!,
      // Convert Unix seconds → ms for Date
      airingAt: new Date(e.anime.nextAiringAt! * 1000),
      userProgress: e.progress,
    }));
}

export async function getRecentReleases(
  userId: string,
): Promise<RecentRelease[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const nowSec = Math.floor(Date.now() / 1000);
  const fourteenDaysAgoSec = nowSec - 14 * 24 * 60 * 60;

  const [mangaEntries, animeEntries] = await Promise.all([
    prisma.trackerEntry.findMany({
      where: {
        userId,
        status: "IN_PROGRESS",
        mediaType: "MANGA",
        anime: {
          latestChapterPublishedAt: {
            gte: fourteenDaysAgo,
          },
        },
      },
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            coverImage: true,
            latestChapter: true,
            latestChapterPublishedAt: true,
          },
        },
      },
    }),
    prisma.trackerEntry.findMany({
      where: {
        userId,
        status: "IN_PROGRESS",
        mediaType: "ANIME",
        OR: [
          {
            anime: {
              lastAiredAt: { gte: fourteenDaysAgo },
              lastAiredEp: { not: null },
            },
          },
          {
            anime: {
              nextAiringAt: {
                gte: fourteenDaysAgoSec,
                lte: nowSec,
              },
              nextAiringEp: { not: null },
            },
          },
        ],
      },
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            coverImage: true,
            nextAiringEp: true,
            nextAiringAt: true,
            lastAiredEp: true,
            lastAiredAt: true,
          },
        },
      },
    }),
  ]);

  const manga: RecentRelease[] = mangaEntries
    .filter(
      (e) =>
        e.anime.latestChapter !== null &&
        e.anime.latestChapterPublishedAt !== null,
    )
    .map((e) => ({
      mediaId: e.anime.id,
      mediaType: "MANGA" as const,
      title: e.anime.title,
      titleEnglish: e.anime.titleEnglish,
      coverImage: e.anime.coverImage,
      releaseNumber: e.anime.latestChapter!,
      releasedAt: e.anime.latestChapterPublishedAt!,
      userProgress: e.progress,
    }));

  const anime: RecentRelease[] = [];
  for (const e of animeEntries) {
    const a = e.anime;
    const lastAiredRecent =
      a.lastAiredAt != null &&
      a.lastAiredEp != null &&
      a.lastAiredAt.getTime() >= fourteenDaysAgo.getTime();

    if (lastAiredRecent) {
      anime.push({
        mediaId: a.id,
        mediaType: "ANIME",
        title: a.title,
        titleEnglish: a.titleEnglish,
        coverImage: a.coverImage,
        releaseNumber: a.lastAiredEp!,
        releasedAt: a.lastAiredAt!,
        userProgress: e.progress,
      });
      continue;
    }

    if (
      a.nextAiringAt != null &&
      a.nextAiringEp != null &&
      a.nextAiringAt >= fourteenDaysAgoSec &&
      a.nextAiringAt <= nowSec
    ) {
      anime.push({
        mediaId: a.id,
        mediaType: "ANIME",
        title: a.title,
        titleEnglish: a.titleEnglish,
        coverImage: a.coverImage,
        releaseNumber: a.nextAiringEp,
        releasedAt: new Date(a.nextAiringAt * 1000),
        userProgress: e.progress,
      });
    }
  }

  return [...manga, ...anime].sort(
    (a, b) => b.releasedAt.getTime() - a.releasedAt.getTime(),
  );
}

/** @deprecated Use getRecentReleases */
export async function getRecentChapters(
  userId: string,
): Promise<RecentRelease[]> {
  return getRecentReleases(userId);
}
