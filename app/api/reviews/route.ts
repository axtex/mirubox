import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";

const MAX_CONTENT_LENGTH = 10_000;

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

  const review = await prisma.review.findUnique({
    where: { userId_animeId: { userId: session.user.id, animeId } },
  });

  return NextResponse.json({ review });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { animeId?: unknown; content?: unknown; containsSpoilers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const animeId = Number(body.animeId);
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const containsSpoilers = body.containsSpoilers === true;

  if (!isValidId(animeId) || content.length === 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Review too long" }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_animeId: { userId: session.user.id, animeId } },
  });

  const review = await prisma.review.upsert({
    where: { userId_animeId: { userId: session.user.id, animeId } },
    create: {
      userId: session.user.id,
      animeId,
      content,
      containsSpoilers,
    },
    update: { content, containsSpoilers },
  });

  if (!existing) {
    await awardXP(session.user.id, "WRITE_REVIEW", { mediaId: animeId });
  }

  return NextResponse.json({ review });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  await prisma.review.deleteMany({
    where: { userId: session.user.id, animeId },
  });

  return NextResponse.json({ ok: true });
}
