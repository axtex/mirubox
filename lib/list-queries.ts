import { prisma } from "@/lib/prisma";
import type { ListCardData } from "@/components/lists/ListCard";

export async function getLists(
  type: string,
  userId: string | null
): Promise<ListCardData[]> {
  const where =
    type === "official"
      ? { isOfficial: true }
      : type === "community"
        ? { isOfficial: false, isPublic: true }
        : type === "mine"
          ? userId
            ? { userId }
            : { id: "none" }
          : { isOfficial: true };

  const lists = await prisma.list.findMany({
    where,
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      _count: { select: { entries: true, likes: true } },
      entries: {
        take: 4,
        orderBy: { order: "asc" },
        select: { mediaId: true },
      },
      ...(userId ? { likes: { where: { userId }, select: { userId: true } } } : {}),
    },
  });

  const allMediaIds = [...new Set(lists.flatMap((l) => l.entries.map((e) => e.mediaId)))];
  const mediaMap = new Map<number, string | null>();
  if (allMediaIds.length > 0) {
    const cached = await prisma.anime.findMany({
      where: { id: { in: allMediaIds } },
      select: { id: true, coverImage: true },
    });
    for (const m of cached) mediaMap.set(m.id, m.coverImage);
  }

  const scored = lists.map((l) => {
    const boost = l.isOfficial ? 2.5 : 1;
    return { list: l, score: l._count.likes * boost };
  });
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.list.createdAt.getTime() - a.list.createdAt.getTime()
  );

  return scored.map(({ list }) => ({
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isOfficial: list.isOfficial,
    username: list.user?.username ?? null,
    entryCount: list._count.entries,
    likeCount: list._count.likes,
    coverPosters: list.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
  }));
}
