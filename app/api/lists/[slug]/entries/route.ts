import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { awardXP, type ToastNotification } from "@/lib/xp";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const list = await prisma.list.findUnique({ where: { slug } });

  if (!list || list.isOfficial || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mediaId?: number; mediaType?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.mediaId || !body.mediaType) {
    return NextResponse.json({ error: "mediaId and mediaType required" }, { status: 400 });
  }

  const existing = await prisma.listEntry.findUnique({
    where: { listId_mediaId: { listId: list.id, mediaId: body.mediaId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already in list" }, { status: 409 });
  }

  // List detail only renders titles present in the anime cache
  let cached = await prisma.anime.findUnique({ where: { id: body.mediaId } });
  if (!cached) {
    const media = await getMediaById(body.mediaId);
    if (media) {
      await cacheAnimeCard(media);
      cached = await prisma.anime.findUnique({ where: { id: body.mediaId } });
    }
  }
  if (!cached) {
    return NextResponse.json({ error: "Could not load title. Try again." }, { status: 502 });
  }

  const maxOrder = await prisma.listEntry.aggregate({
    where: { listId: list.id },
    _max: { order: true },
  });

  const entry = await prisma.listEntry.create({
    data: {
      listId: list.id,
      mediaId: body.mediaId,
      mediaType: body.mediaType,
      note: body.note ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  const result = await awardXP(session.user.id, "ADD_TO_LIST", { mediaId: body.mediaId, listId: list.id });
  const notifications: ToastNotification[] = result?.notifications ?? [];

  return NextResponse.json({ ...entry, notifications }, { status: 201 });
}

export async function DELETE(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const list = await prisma.list.findUnique({ where: { slug } });

  if (!list || list.isOfficial || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mediaId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  const entry = await prisma.listEntry.findUnique({
    where: { listId_mediaId: { listId: list.id, mediaId: body.mediaId } },
  });
  if (!entry) {
    return NextResponse.json({ ok: true });
  }

  const count = await prisma.listEntry.count({ where: { listId: list.id } });
  if (count <= 1) {
    return NextResponse.json(
      { error: "Lists need at least one title. Delete the list instead." },
      { status: 400 }
    );
  }

  await prisma.listEntry.delete({
    where: { listId_mediaId: { listId: list.id, mediaId: body.mediaId } },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const list = await prisma.list.findUnique({ where: { slug } });

  if (!list || list.isOfficial || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mediaIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.mediaIds) || !body.mediaIds.every((id) => typeof id === "number")) {
    return NextResponse.json({ error: "mediaIds array required" }, { status: 400 });
  }

  const mediaIds = body.mediaIds as number[];
  const existing = await prisma.listEntry.findMany({
    where: { listId: list.id },
    select: { mediaId: true },
  });
  const existingSet = new Set(existing.map((e) => e.mediaId));
  if (
    mediaIds.length !== existing.length ||
    mediaIds.some((id) => !existingSet.has(id))
  ) {
    return NextResponse.json({ error: "mediaIds must match list entries" }, { status: 400 });
  }

  await prisma.$transaction(
    mediaIds.map((mediaId, order) =>
      prisma.listEntry.update({
        where: { listId_mediaId: { listId: list.id, mediaId } },
        data: { order },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
