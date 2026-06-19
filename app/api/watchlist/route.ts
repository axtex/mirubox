import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { getMediaById } from "@/lib/anilist";
import { awardXP } from "@/lib/xp";
import { embedAnimeIfNeeded } from "@/lib/embed-on-cache";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type")?.toUpperCase();
  const mediaType = typeParam === "ANIME" || typeParam === "MANGA" ? typeParam : undefined;

  const entries = await prisma.watchlistEntry.findMany({
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

  const body = await req.json() as {
    animeId?: unknown;
    status?: unknown;
    mediaType?: unknown;
    progress?: unknown;
    total?: unknown;
  };
  const animeId = Number(body.animeId);
  const status = typeof body.status === "string" ? body.status : "PLANNED";
  const progress = typeof body.progress === "number" ? body.progress : 0;
  const total = typeof body.total === "number" ? body.total : undefined;

  if (isNaN(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

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

  // Derive mediaType from Anime record if caller doesn't specify
  const mediaType =
    typeof body.mediaType === "string" && (body.mediaType === "ANIME" || body.mediaType === "MANGA")
      ? body.mediaType
      : (cached?.type === "MANGA" ? "MANGA" : "ANIME");

  const entry = await prisma.watchlistEntry.upsert({
    where: { userId_animeId: { userId: session.user.id, animeId } },
    create: {
      userId: session.user.id,
      animeId,
      status,
      mediaType,
      progress,
      ...(total !== undefined ? { total } : {}),
    },
    update: {
      status,
      mediaType,
      progress,
      ...(total !== undefined ? { total } : {}),
    },
  });

  const xpAmount = status === "COMPLETED" ? 10 : 5;
  const reason = status === "COMPLETED" ? "Marked as completed" : "Added to tracker";
  await awardXP(session.user.id, xpAmount, reason, animeId);

  void embedAnimeIfNeeded(animeId);

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { animeId?: unknown };
  const animeId = Number(body.animeId);

  if (isNaN(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

  await prisma.watchlistEntry.deleteMany({
    where: { userId: session.user.id, animeId },
  });

  return NextResponse.json({ success: true });
}
