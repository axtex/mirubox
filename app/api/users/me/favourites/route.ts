import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_TOP = 3;

const MEDIA_SELECT = {
  id: true,
  title: true,
  titleEnglish: true,
  coverImage: true,
  format: true,
  seasonYear: true,
  type: true,
  episodes: true,
  chapters: true,
  averageScore: true,
} as const;

function isValidId(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n > 0 &&
    n <= 2147483647
  );
}

function parseType(value: unknown): "anime" | "manga" | null {
  return value === "anime" || value === "manga" ? value : null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = parseType(new URL(req.url).searchParams.get("type"));
  if (!type) {
    return NextResponse.json({ error: "type must be 'anime' or 'manga'" }, { status: 400 });
  }

  const userId = session.user.id;
  const mediaType = type === "anime" ? "ANIME" : "MANGA";

  const [pool, selected] = await Promise.all([
    prisma.favourite.findMany({
      where: { userId, mediaType },
      orderBy: { createdAt: "desc" },
      include: { anime: { select: MEDIA_SELECT } },
    }),
    type === "anime"
      ? prisma.favouriteAnime.findMany({
          where: { userId },
          orderBy: { order: "asc" },
          take: MAX_TOP,
          select: { mediaId: true, order: true },
        })
      : prisma.favouriteManga.findMany({
          where: { userId },
          orderBy: { order: "asc" },
          take: MAX_TOP,
          select: { mediaId: true, order: true },
        }),
  ]);

  return NextResponse.json({
    type,
    pool: pool.map((f) => ({
      mediaId: f.mediaId,
      media: f.anime,
    })),
    selected: selected.map((s) => s.mediaId),
  });
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: unknown; mediaIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = parseType(body.type);
  if (!type) {
    return NextResponse.json({ error: "type must be 'anime' or 'manga'" }, { status: 400 });
  }

  if (!Array.isArray(body.mediaIds)) {
    return NextResponse.json({ error: "mediaIds must be an array" }, { status: 400 });
  }

  const mediaIds = body.mediaIds.map(Number).filter(isValidId);
  if (mediaIds.length > MAX_TOP) {
    return NextResponse.json({ error: `Max ${MAX_TOP} top titles per type` }, { status: 400 });
  }

  // Dedupe while preserving order
  const uniqueIds = [...new Set(mediaIds)];
  const userId = session.user.id;
  const mediaType = type === "anime" ? "ANIME" : "MANGA";

  if (uniqueIds.length > 0) {
    const hearted = await prisma.favourite.findMany({
      where: { userId, mediaType, mediaId: { in: uniqueIds } },
      select: { mediaId: true },
    });
    const heartedSet = new Set(hearted.map((h) => h.mediaId));
    if (uniqueIds.some((id) => !heartedSet.has(id))) {
      return NextResponse.json(
        { error: "All titles must be in your favourites" },
        { status: 400 }
      );
    }
  }

  if (type === "anime") {
    await prisma.$transaction([
      prisma.favouriteAnime.deleteMany({ where: { userId } }),
      ...uniqueIds.map((mediaId, order) =>
        prisma.favouriteAnime.create({
          data: { userId, mediaId, order },
        })
      ),
    ]);
  } else {
    await prisma.$transaction([
      prisma.favouriteManga.deleteMany({ where: { userId } }),
      ...uniqueIds.map((mediaId, order) =>
        prisma.favouriteManga.create({
          data: { userId, mediaId, order },
        })
      ),
    ]);
  }

  return NextResponse.json({ ok: true, type, mediaIds: uniqueIds });
}
