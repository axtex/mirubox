import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { getMediaById } from "@/lib/anilist";
import { awardXP } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.watchlistEntry.findMany({
    where: { userId: session.user.id },
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

  const body = await req.json() as { animeId?: unknown; status?: unknown; progress?: unknown };
  const animeId = Number(body.animeId);
  const status = typeof body.status === "string" ? body.status : "PLAN_TO_WATCH";
  const progress = typeof body.progress === "number" ? body.progress : 0;

  if (isNaN(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

  // Ensure anime exists in DB cache
  const existing = await prisma.anime.findUnique({ where: { id: animeId } });
  if (!existing) {
    const media = await getMediaById(animeId);
    if (media) {
      await cacheAnimeCard(media);
    }
  }

  const entry = await prisma.watchlistEntry.upsert({
    where: { userId_animeId: { userId: session.user.id, animeId } },
    create: { userId: session.user.id, animeId, status, progress },
    update: { status, progress },
  });

  // XP: +10 for completing, +5 for adding
  const xpAmount = status === "COMPLETED" ? 10 : 5;
  await awardXP(session.user.id, xpAmount);

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
