import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, type ToastNotification } from "@/lib/xp";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
  const mediaIdParam = searchParams.get("mediaId");
  const filterMediaId =
    mediaIdParam && !Number.isNaN(Number(mediaIdParam)) ? Number(mediaIdParam) : null;
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
      user: { select: { username: true } },
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

  const listsWithMedia = new Set<string>();
  if (filterMediaId !== null && type === "mine" && page.length > 0) {
    const entries = await prisma.listEntry.findMany({
      where: {
        mediaId: filterMediaId,
        listId: { in: page.map((l) => l.id) },
      },
      select: { listId: true },
    });
    for (const entry of entries) listsWithMedia.add(entry.listId);
  }

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
    username: list.user?.username ?? null,
    entryCount: list._count.entries,
    likeCount: list._count.likes,
    isLikedByCurrentUser: Array.isArray(list.likes) ? list.likes.length > 0 : false,
    coverPosters: list.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    ...(filterMediaId !== null ? { hasMedia: listsWithMedia.has(list.id) } : {}),
  }));

  return NextResponse.json({ lists: result, nextCursor: hasNextPage ? lastId : null });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`lists:${session.user.id}`, 10, 60000);
  if (!success) return rateLimitResponse();

  let body: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    entries?: Array<{ mediaId?: unknown; mediaType?: unknown }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const entries = (body.entries ?? []).filter(
    (e): e is { mediaId: number; mediaType: string } =>
      typeof e.mediaId === "number" && (e.mediaType === "ANIME" || e.mediaType === "MANGA")
  );

  if (entries.length < 1) {
    return NextResponse.json({ error: "A list must contain at least one title." }, { status: 400 });
  }
  if (entries.length > 100) {
    return NextResponse.json({ error: "A list cannot contain more than 100 titles." }, { status: 400 });
  }

  const slug = await uniqueSlug(toSlug(body.title.trim()));

  const list = await prisma.$transaction(async (tx) => {
    const created = await tx.list.create({
      data: {
        slug,
        title: body.title!.trim().slice(0, 80),
        description: body.description?.trim().slice(0, 300) ?? null,
        isPublic: body.isPublic ?? true,
        userId: session.user.id,
      },
    });

    await tx.listEntry.createMany({
      data: entries.map((e, i) => ({
        listId: created.id,
        mediaId: e.mediaId,
        mediaType: e.mediaType,
        order: i,
      })),
      skipDuplicates: true,
    });

    return created;
  });

  const notifications: ToastNotification[] = [];
  const createResult = await awardXP(session.user.id, "CREATE_LIST", { listId: list.id });
  if (createResult) notifications.push(...createResult.notifications);
  for (const entry of entries) {
    const entryResult = await awardXP(session.user.id, "ADD_TO_LIST", {
      mediaId: entry.mediaId,
      listId: list.id,
    });
    if (entryResult) notifications.push(...entryResult.notifications);
  }

  return NextResponse.json({ ...list, notifications }, { status: 201 });
}
