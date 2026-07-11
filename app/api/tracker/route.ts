import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { getMediaById } from "@/lib/anilist";
import { awardXP, type ToastNotification } from "@/lib/xp";
import {
  initSeasonChallengeStart,
  syncSeasonChallenge,
} from "@/lib/season-challenge-sync";
import { embedAnimeIfNeeded } from "@/lib/embed-on-cache";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const SHORT_FORMATS = ["MOVIE", "OVA", "SPECIAL", "MUSIC"];

function isValidId(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n > 0 &&
    n <= 2147483647
  );
}

function isValidCount(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n >= 0 &&
    n <= 100000
  );
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type")?.toUpperCase();
  const mediaType = typeParam === "ANIME" || typeParam === "MANGA" ? typeParam : undefined;

  const entries = await prisma.trackerEntry.findMany({
    where: { userId: session.user.id, ...(mediaType ? { mediaType } : {}) },
    include: { anime: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`watchlist:${session.user.id}`, 30, 60000);
  if (!success) return rateLimitResponse();

  let body: {
    animeId?: unknown;
    status?: unknown;
    mediaType?: unknown;
    progress?: unknown;
    total?: unknown;
    favourite?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const animeId = Number(body.animeId);
  if (!isValidId(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

  if (body.progress !== undefined && !isValidCount(body.progress)) {
    return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
  }
  if (body.total !== undefined && !isValidCount(body.total)) {
    return NextResponse.json({ error: "Invalid total value" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : null;
  const progress = typeof body.progress === "number" ? body.progress : null;
  const total = typeof body.total === "number" ? body.total : undefined;
  const favourite = typeof body.favourite === "boolean" ? body.favourite : undefined;

  // favourite-only update — don't touch status or progress
  if (status === null && favourite !== undefined) {
    await prisma.trackerEntry.updateMany({
      where: { userId: session.user.id, animeId },
      data: { favourite },
    });
    return NextResponse.json({ success: true });
  }

  const statusStr = status ?? "PLANNED";

  const existing = await prisma.trackerEntry.findUnique({
    where: { userId_animeId: { userId: session.user.id, animeId } },
  });

  // Ensure anime exists in DB cache (refresh if manga is missing chapter counts)
  let cached = await prisma.anime.findUnique({ where: { id: animeId } });
  const needsRefresh = !cached || (cached.type === "MANGA" && cached.chapters == null);
  if (needsRefresh) {
    const media = await getMediaById(animeId);
    if (media) {
      await cacheAnimeCard(media);
      cached = await prisma.anime.findUnique({ where: { id: animeId } });
    }
  }

  const mediaType =
    typeof body.mediaType === "string" && (body.mediaType === "ANIME" || body.mediaType === "MANGA")
      ? body.mediaType
      : (cached?.type === "MANGA" ? "MANGA" : "ANIME");

  const entry = await prisma.trackerEntry.upsert({
    where: { userId_animeId: { userId: session.user.id, animeId } },
    create: {
      userId: session.user.id,
      animeId,
      status: statusStr,
      mediaType,
      progress: progress ?? 0,
      ...(total !== undefined ? { total } : {}),
      ...(favourite !== undefined ? { favourite } : {}),
    },
    update: {
      status: statusStr,
      mediaType,
      ...(progress !== null ? { progress } : {}),
      ...(total !== undefined ? { total } : {}),
      ...(favourite !== undefined ? { favourite } : {}),
    },
  });

  const notifications: ToastNotification[] = [];

  const seasonMeta = {
    season: cached?.season ?? null,
    seasonYear: cached?.seasonYear ?? null,
  };

  if (statusStr !== "FAVOURITE") {
    if (!existing) {
      await initSeasonChallengeStart(session.user.id);

      const totalEntries = await prisma.trackerEntry.count({ where: { userId: session.user.id } });
      if (totalEntries === 1) {
        const result = await awardXP(session.user.id, "FIRST_TITLE");
        if (result) notifications.push(...result.notifications);
      }

      if (statusStr === "COMPLETED") {
        const result = await awardXP(session.user.id, "MARK_COMPLETED_DIRECT", { mediaId: animeId });
        if (result) notifications.push(...result.notifications);
        await syncSeasonChallenge(session.user.id, seasonMeta);
      } else {
        const result = await awardXP(session.user.id, "ADD_TO_TRACKER", { mediaId: animeId });
        if (result) notifications.push(...result.notifications);
      }
    } else {
      const wasPlanned = existing.status === "PLANNED";
      const wasWatching = existing.status === "IN_PROGRESS";
      const wasCompleted = existing.status === "COMPLETED";
      const nowWatching = statusStr === "IN_PROGRESS";
      const nowCompleted = statusStr === "COMPLETED";

      if (wasPlanned && nowWatching) {
        const result = await awardXP(session.user.id, "MARK_IN_PROGRESS", { mediaId: animeId });
        if (result) notifications.push(...result.notifications);
      }

      if (wasWatching && nowCompleted) {
        const isShortFormat = cached?.format ? SHORT_FORMATS.includes(cached.format) : false;
        const result = await awardXP(session.user.id, isShortFormat ? "COMPLETE_MOVIE_OVA" : "MARK_COMPLETED", {
          mediaId: animeId,
        });
        if (result) notifications.push(...result.notifications);
        await syncSeasonChallenge(session.user.id, seasonMeta);
      }

      if (wasCompleted && !nowCompleted) {
        await syncSeasonChallenge(session.user.id, seasonMeta);
      }
    }
  }

  void embedAnimeIfNeeded(animeId);

  return NextResponse.json({ entry, notifications });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`watchlist:${session.user.id}`, 30, 60000);
  if (!success) return rateLimitResponse();

  let body: { animeId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const animeId = Number(body.animeId);

  if (!isValidId(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

  const cached = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { season: true, seasonYear: true },
  });

  await prisma.trackerEntry.deleteMany({
    where: { userId: session.user.id, animeId },
  });

  if (cached?.season && cached.seasonYear != null) {
    await syncSeasonChallenge(session.user.id, {
      season: cached.season,
      seasonYear: cached.seasonYear,
    });
  }

  return NextResponse.json({ success: true });
}
