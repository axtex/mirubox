import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const animeId = Number(searchParams.get("animeId"));

  if (isNaN(animeId)) {
    return NextResponse.json({ error: "Invalid animeId" }, { status: 400 });
  }

  const rating = await prisma.rating.findUnique({
    where: { userId_animeId: { userId: session.user.id, animeId } },
  });

  return NextResponse.json({ rating });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { animeId?: unknown; score?: unknown };
  const animeId = Number(body.animeId);
  const score = Number(body.score);

  if (isNaN(animeId) || isNaN(score) || score < 1 || score > 10) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.rating.findUnique({
    where: { userId_animeId: { userId: session.user.id, animeId } },
  });

  const media = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { averageScore: true },
  });

  const rating = await prisma.rating.upsert({
    where: { userId_animeId: { userId: session.user.id, animeId } },
    create: { userId: session.user.id, animeId, score, anilistScoreAtRating: media?.averageScore ?? null },
    update: { score, anilistScoreAtRating: media?.averageScore ?? null },
  });

  // Only award XP on first rating
  if (!existing) {
    await awardXP(session.user.id, "RATE_TITLE", { mediaId: animeId });
  }

  return NextResponse.json({ rating });
}
