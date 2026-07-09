import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { getMediaById } from "@/lib/anilist";

function isValidId(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n > 0 &&
    n <= 2147483647
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId: session.user.id },
    include: {
      anime: {
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          format: true,
          episodes: true,
          chapters: true,
          volumes: true,
          averageScore: true,
          seasonYear: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favourites });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mediaId?: unknown; mediaType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const mediaId = Number(body.mediaId);
  if (!isValidId(mediaId)) {
    return NextResponse.json({ error: "Invalid mediaId" }, { status: 400 });
  }

  const mediaType =
    typeof body.mediaType === "string" && (body.mediaType === "ANIME" || body.mediaType === "MANGA")
      ? body.mediaType
      : "ANIME";

  // Ensure anime is cached in DB
  const cached = await prisma.anime.findUnique({ where: { id: mediaId } });
  if (!cached) {
    const media = await getMediaById(mediaId);
    if (media) await cacheAnimeCard(media);
  }

  const favourite = await prisma.favourite.upsert({
    where: { userId_mediaId: { userId: session.user.id, mediaId } },
    create: { userId: session.user.id, mediaId, mediaType },
    update: {},
  });

  return NextResponse.json({ favourite });
}
