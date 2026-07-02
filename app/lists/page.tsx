import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListCard, CreateListCard } from "@/components/lists/ListCard";
import type { ListCardData } from "@/components/lists/ListCard";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

async function getLists(type: string, userId: string | null): Promise<ListCardData[]> {
  const where =
    type === "official"
      ? { isOfficial: true }
      : type === "community"
        ? { isOfficial: false, isPublic: true }
        : { isPublic: true };

  const lists = await prisma.list.findMany({
    where,
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: { select: { entries: true, likes: true } },
      entries: {
        take: 4,
        orderBy: { order: "asc" },
        select: { mediaId: true },
      },
      ...(userId ? { likes: { where: { userId }, select: { userId: true } } } : {}),
    },
  });

  // Bulk fetch cover images
  const allMediaIds = [...new Set(lists.flatMap((l) => l.entries.map((e) => e.mediaId)))];
  const mediaMap = new Map<number, string | null>();
  if (allMediaIds.length > 0) {
    const cached = await prisma.anime.findMany({
      where: { id: { in: allMediaIds } },
      select: { id: true, coverImage: true },
    });
    for (const m of cached) mediaMap.set(m.id, m.coverImage);
  }

  // Sort by boosted score
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
    username: list.user?.name ?? null,
    entryCount: list._count.entries,
    likeCount: list._count.likes,
    coverPosters: list.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
  }));
}

export default async function ListsPage({ searchParams }: PageProps) {
  const session = await auth();
  const { type: typeParam } = await searchParams;
  const type = ["all", "official", "community"].includes(typeParam ?? "")
    ? (typeParam ?? "all")
    : "all";

  const lists = await getLists(type, session?.user?.id ?? null);
  const isLoggedIn = !!session?.user?.id;

  const TABS = [
    { value: "all", label: "ALL" },
    { value: "official", label: "OFFICIAL" },
    { value: "community", label: "COMMUNITY" },
  ];

  return (
    <div className="page-container py-8">

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h1
            className="text-headline-lg font-display uppercase"
            style={{ marginBottom: 4 }}
          >
            LISTS
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
            }}
          >
            Curated by mirubox and the community
          </p>
        </div>

        {isLoggedIn && (
          <Link
            href="/lists/new"
            className="btn-primary shrink-0"
            style={{ fontSize: 10, letterSpacing: "0.08em" }}
          >
            + CREATE LIST
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {TABS.map(({ value, label }) => {
          const active = type === value;
          return (
            <Link
              key={value}
              href={`/lists?type=${value}`}
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "10px 14px",
                color: active ? "var(--primary)" : "var(--fg-muted)",
                borderBottom: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                marginBottom: -1,
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
            >
              {label}
            </Link>
          );
        })}
        {isLoggedIn && (
          <Link
            href="/profile?tab=lists"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              padding: "10px 14px",
              color: "var(--fg-muted)",
              borderBottom: "1.5px solid transparent",
              marginBottom: -1,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            MINE
          </Link>
        )}
      </div>

      {/* Grid */}
      {lists.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            padding: "48px 0",
          }}
        >
          No lists yet. Be the first to create one.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
          {isLoggedIn && <CreateListCard />}
        </div>
      )}
    </div>
  );
}
