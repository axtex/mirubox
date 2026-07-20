import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAiringData, type AiringMedia } from "@/lib/anilist";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== "development") {
    if (!cronSecret) {
      console.error("[episode-check] CRON_SECRET not set");
      return Response.json({ error: "Misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runEpisodeCheck();
    return Response.json(result);
  } catch (err) {
    console.error("[episode-check] failed:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function runEpisodeCheck(): Promise<{
  checked: number;
  distinctAnime?: number;
  notified: number;
  duration: number;
}> {
  const startTime = Date.now();

  const inProgressEntries = await prisma.trackerEntry.findMany({
    where: {
      status: "IN_PROGRESS",
      mediaType: "ANIME",
      user: {
        episodeNotifications: true,
      },
    },
    select: {
      userId: true,
      animeId: true,
      progress: true,
      lastNotifiedEp: true,
      anime: {
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          episodes: true,
          status: true,
          airingStatus: true,
          nextAiringEp: true,
          nextAiringAt: true,
          episodesRefreshedAt: true,
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

  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();

  const needsRefresh = [
    ...new Set(inProgressEntries.map((e) => e.animeId)),
  ].filter((id) => {
    const entry = inProgressEntries.find((e) => e.animeId === id);
    const refreshedAt = entry?.anime.episodesRefreshedAt?.getTime() ?? 0;
    return now - refreshedAt > TWO_HOURS;
  });

  let airingDataMap: Map<number, AiringMedia> = new Map();

  if (needsRefresh.length > 0) {
    const airingData = await getAiringData(needsRefresh);
    airingDataMap = new Map(airingData.map((m) => [m.id, m]));
    const nowSec = Math.floor(Date.now() / 1000);

    await Promise.all(
      airingData.map((m) => {
        const prev = inProgressEntries.find((e) => e.animeId === m.id)?.anime;
        const lastAiredFields =
          prev?.nextAiringAt != null &&
          prev.nextAiringEp != null &&
          prev.nextAiringAt <= nowSec
            ? {
                lastAiredEp: prev.nextAiringEp,
                lastAiredAt: new Date(prev.nextAiringAt * 1000),
              }
            : {};

        return prisma.anime
          .update({
            where: { id: m.id },
            data: {
              nextAiringEp: m.nextAiringEpisode?.episode ?? null,
              nextAiringAt: m.nextAiringEpisode?.airingAt ?? null,
              airingStatus: m.status,
              episodesRefreshedAt: new Date(),
              ...lastAiredFields,
              ...(m.status === "FINISHED" && m.episodes
                ? { episodes: m.episodes }
                : {}),
            },
          })
          .catch((err) => {
            console.error("[episode-check] update failed for", m.id, err);
          });
      }),
    );
  }

  let notified = 0;

  for (const entry of inProgressEntries) {
    const fresh = airingDataMap.get(entry.animeId);

    const status =
      fresh?.status ??
      entry.anime.airingStatus ??
      entry.anime.status ??
      "RELEASING";

    const nextEp =
      fresh?.nextAiringEpisode?.episode ?? entry.anime.nextAiringEp ?? null;

    const totalEpisodes = fresh?.episodes ?? entry.anime.episodes ?? null;

    let availableEp: number | null = null;

    if (status === "FINISHED" && totalEpisodes) {
      availableEp = totalEpisodes;
    } else if (status === "RELEASING" && nextEp) {
      availableEp = nextEp - 1;
    }

    if (!availableEp) continue;
    if (availableEp <= entry.progress) continue;
    if (entry.lastNotifiedEp && entry.lastNotifiedEp >= availableEp) continue;

    const title =
      entry.anime.titleEnglish ?? entry.anime.title ?? "Unknown title";

    try {
      await createNotification({
        userId: entry.userId,
        type: "EPISODE_AVAILABLE",
        title: `EP ${availableEp} is out`,
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
          lastNotifiedEp: availableEp,
        },
      });

      notified++;
    } catch (err) {
      console.error(
        "[episode-check] notify failed for user",
        entry.userId,
        "anime",
        entry.animeId,
        err,
      );
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `[episode-check] done in ${duration}ms — checked ${inProgressEntries.length} entries, notified ${notified} users`,
  );

  return {
    checked: inProgressEntries.length,
    distinctAnime: needsRefresh.length,
    notified,
    duration,
  };
}
