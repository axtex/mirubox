import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListCard } from "@/components/lists/ListCard";

async function getTopLists() {
  try {
    return await fetchTopLists();
  } catch {
    return [];
  }
}

async function fetchTopLists() {
  const lists = await prisma.list.findMany({
    where: { isOfficial: true },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: { select: { entries: true, likes: true } },
      entries: {
        take: 4,
        orderBy: { order: "asc" },
        select: { mediaId: true },
      },
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

  return lists
    .map((l) => ({
      score: l._count.likes,
      data: {
        id: l.id,
        slug: l.slug,
        title: l.title,
        description: l.description,
        isOfficial: l.isOfficial,
        username: l.user?.name ?? null,
        entryCount: l._count.entries,
        likeCount: l._count.likes,
        coverPosters: l.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
      },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.data);
}

export async function CuratedListsSection() {
  const lists = await getTopLists();

  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">CURATED LISTS</h2>
          <Link
            href="/community?tab=lists&type=official"
            className="text-label"
            style={{ color: "var(--fg-subtle)", textDecoration: "none" }}
          >
            VIEW ALL
          </Link>
        </div>
        <div className="section-underline" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
}
