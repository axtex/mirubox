import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, type ToastNotification } from "@/lib/xp";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function isValidId(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n > 0 &&
    n <= 2147483647
  );
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const animeId = Number(searchParams.get("animeId"));

  if (!isValidId(animeId)) {
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

  const { success } = await rateLimit(`ratings:${session.user.id}`, 30, 60000);
  if (!success) return rateLimitResponse();

  let body: { animeId?: unknown; score?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const animeId = Number(body.animeId);
  const score = Number(body.score);

  if (!isValidId(animeId) || isNaN(score) || score < 1 || score > 10) {
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
  let notifications: ToastNotification[] = [];
  if (!existing) {
    const result = await awardXP(session.user.id, "RATE_TITLE", { mediaId: animeId });
    if (result) notifications = result.notifications;
  }

  return NextResponse.json({ rating, notifications });
}
