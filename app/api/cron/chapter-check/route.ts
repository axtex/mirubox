import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveMangaDexId, getLatestChapterWithDate } from "@/lib/mangadex";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== "development") {
    if (!cronSecret) {
      console.error("[chapter-check] CRON_SECRET not set");
      return Response.json({ error: "Misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runChapterCheck();
    return Response.json(result);
  } catch (err) {
    console.error("[chapter-check] failed:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function runChapterCheck(): Promise<{
  checked: number;
  distinctManga?: number;
  notified: number;
  duration: number;
}> {
  const startTime = Date.now();

  const inProgressEntries = await prisma.trackerEntry.findMany({
    where: {
      status: "IN_PROGRESS",
      mediaType: "MANGA",
      user: {
        chapterNotifications: true,
      },
    },
    select: {
      userId: true,
      animeId: true,
      progress: true,
      lastNotifiedChapter: true,
      anime: {
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          chapters: true,
          status: true,
          mangaDexId: true,
          latestChapter: true,
          chaptersRefreshedAt: true,
        },
      },
    },
  });

  if (inProgressEntries.length === 0) {
    return {
      checked: 0,
      notified: 0,
      duration: Date.now() - startTime,
    };
  }

  // Hobby plan: cron runs once daily — match refresh window to that cadence
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const distinctManga = [
    ...new Map(inProgressEntries.map((e) => [e.animeId, e.anime])).values(),
  ];

  const needsRefresh = distinctManga.filter((manga) => {
    const refreshedAt = manga.chaptersRefreshedAt?.getTime() ?? 0;
    return now - refreshedAt > ONE_DAY;
  });

  const latestChapterMap: Map<number, number> = new Map();

  for (const manga of needsRefresh) {
    try {
      if (
        manga.status === "FINISHED" &&
        manga.chapters &&
        manga.latestChapter != null &&
        manga.latestChapter >= manga.chapters
      ) {
        continue;
      }

      let mdId = manga.mangaDexId;

      if (!mdId) {
        mdId = await resolveMangaDexId(
          manga.id,
          manga.titleEnglish,
          manga.title,
        );
      }

      if (!mdId) {
        console.warn(
          "[chapter-check] no MangaDex ID for",
          manga.id,
          manga.titleEnglish ?? manga.title,
        );
        continue;
      }

      const latest = await getLatestChapterWithDate(mdId);
      if (latest === null) continue;

      latestChapterMap.set(manga.id, latest.chapter);

      await prisma.anime.update({
        where: { id: manga.id },
        data: {
          mangaDexId: mdId,
          latestChapter: latest.chapter,
          latestChapterPublishedAt: latest.publishAt,
          chaptersRefreshedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[chapter-check] failed for manga", manga.id, err);
    }
  }

  let notified = 0;

  for (const entry of inProgressEntries) {
    const latestChapter =
      latestChapterMap.get(entry.animeId) ??
      entry.anime.latestChapter ??
      null;

    if (latestChapter === null) continue;

    const userProgress = entry.progress;

    if (latestChapter <= userProgress) continue;

    if (
      entry.lastNotifiedChapter != null &&
      entry.lastNotifiedChapter >= latestChapter
    ) {
      continue;
    }

    const title =
      entry.anime.titleEnglish ?? entry.anime.title ?? "Unknown manga";

    try {
      await createNotification({
        userId: entry.userId,
        type: "CHAPTER_AVAILABLE",
        title: `CH ${latestChapter} is out`,
        body: title,
        mediaId: entry.animeId,
      });

      await prisma.trackerEntry.update({
        where: {
          userId_animeId: {
            userId: entry.userId,
            animeId: entry.animeId,
          },
        },
        data: {
          lastNotifiedChapter: latestChapter,
        },
      });

      notified++;
    } catch (err) {
      console.error(
        "[chapter-check] notify failed for user",
        entry.userId,
        "manga",
        entry.animeId,
        err,
      );
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `[chapter-check] done in ${duration}ms — checked ${inProgressEntries.length} entries, notified ${notified} users`,
  );

  return {
    checked: inProgressEntries.length,
    distinctManga: needsRefresh.length,
    notified,
    duration,
  };
}
