import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const body = (await req.json()) as { mediaId?: number; mediaType?: string; note?: string };
  if (!body.mediaId || !body.mediaType) {
    return NextResponse.json({ error: "mediaId and mediaType required" }, { status: 400 });
  }

  const existing = await prisma.listEntry.findUnique({
    where: { listId_mediaId: { listId: list.id, mediaId: body.mediaId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already in list" }, { status: 409 });
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

  return NextResponse.json(entry, { status: 201 });
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

  const body = (await req.json()) as { mediaId?: number };
  if (!body.mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  await prisma.listEntry.deleteMany({
    where: { listId: list.id, mediaId: body.mediaId },
  });

  return NextResponse.json({ ok: true });
}
