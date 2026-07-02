import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  const { slug } = await ctx.params;

  const list = await prisma.list.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true } },
      _count: { select: { likes: true } },
      entries: {
        orderBy: { order: "asc" },
        select: { id: true, mediaId: true, mediaType: true, order: true, note: true },
      },
      likes: session?.user?.id
        ? { where: { userId: session.user.id }, select: { userId: true } }
        : false,
    },
  });

  if (!list || (!list.isPublic && list.userId !== session?.user?.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Enrich entries with media data from cache
  const mediaIds = list.entries.map((e) => e.mediaId);
  const mediaMap = new Map<
    number,
    { id: number; title: string; titleEnglish: string | null; coverImage: string | null; averageScore: number | null; format: string | null }
  >();
  if (mediaIds.length > 0) {
    const cached = await prisma.anime.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, title: true, titleEnglish: true, coverImage: true, averageScore: true, format: true },
    });
    for (const m of cached) mediaMap.set(m.id, m);
  }

  const entries = list.entries.map((e) => ({
    ...e,
    media: mediaMap.get(e.mediaId) ?? null,
  }));

  return NextResponse.json({
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isOfficial: list.isOfficial,
    isPublic: list.isPublic,
    userId: list.userId,
    username: list.user?.name ?? null,
    likeCount: list._count.likes,
    isLikedByCurrentUser: Array.isArray(list.likes) ? list.likes.length > 0 : false,
    isOwner: !list.isOfficial && list.userId === session?.user?.id,
    entries,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  });
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

  const body = (await req.json()) as { title?: string; description?: string; isPublic?: boolean };

  const updated = await prisma.list.update({
    where: { slug },
    data: {
      ...(body.title ? { title: body.title.trim().slice(0, 80) } : {}),
      ...(body.description !== undefined ? { description: body.description.trim().slice(0, 300) } : {}),
      ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const list = await prisma.list.findUnique({ where: { slug } });

  if (!list || list.isOfficial || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.list.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
