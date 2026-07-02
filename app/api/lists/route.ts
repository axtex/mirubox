import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  const exists = await prisma.list.findUnique({ where: { slug: base } });
  if (!exists) return base;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const cursor = searchParams.get("cursor") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 20), 50);

  const where =
    type === "official"
      ? { isOfficial: true }
      : type === "user"
        ? { isOfficial: false, isPublic: true }
        : type === "mine"
          ? session?.user?.id
            ? { userId: session.user.id }
            : { id: "none" }
          : { isPublic: true };

  const lists = await prisma.list.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: { select: { entries: true, likes: true } },
      entries: {
        take: 4,
        orderBy: { order: "asc" },
        select: { mediaId: true, mediaType: true },
      },
      likes: session?.user?.id
        ? { where: { userId: session.user.id }, select: { userId: true } }
        : false,
    },
  });

  const hasNextPage = lists.length > take;
  const page = hasNextPage ? lists.slice(0, take) : lists;
  const lastId = page[page.length - 1]?.id;

  // Collect all entry media IDs to look up cover images in bulk
  const allMediaIds = [...new Set(page.flatMap((l) => l.entries.map((e) => e.mediaId)))];
  const mediaMap = new Map<number, string | null>();
  if (allMediaIds.length > 0) {
    const cached = await prisma.anime.findMany({
      where: { id: { in: allMediaIds } },
      select: { id: true, coverImage: true },
    });
    for (const m of cached) mediaMap.set(m.id, m.coverImage);
  }

  // Sort by boosted score
  const scored = page.map((l) => {
    const likeCount = l._count.likes;
    const boost = l.isOfficial ? 2.5 : 1;
    return { list: l, score: likeCount * boost };
  });
  scored.sort((a, b) => b.score - a.score || b.list.createdAt.getTime() - a.list.createdAt.getTime());

  const result = scored.map(({ list }) => ({
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isOfficial: list.isOfficial,
    isPublic: list.isPublic,
    userId: list.userId,
    username: list.user?.name ?? null,
    entryCount: list._count.entries,
    likeCount: list._count.likes,
    isLikedByCurrentUser: Array.isArray(list.likes) ? list.likes.length > 0 : false,
    coverPosters: list.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }));

  return NextResponse.json({ lists: result, nextCursor: hasNextPage ? lastId : null });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { title?: string; description?: string; isPublic?: boolean };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const slug = await uniqueSlug(toSlug(body.title.trim()));

  const list = await prisma.list.create({
    data: {
      slug,
      title: body.title.trim().slice(0, 80),
      description: body.description?.trim().slice(0, 300) ?? null,
      isPublic: body.isPublic ?? true,
      userId: session.user.id,
    },
  });

  return NextResponse.json(list, { status: 201 });
}
