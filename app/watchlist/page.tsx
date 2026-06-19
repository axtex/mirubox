import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TrackerClient } from "./TrackerClient";
import { TABS } from "./types";
import type { WatchlistStatus, SortKey, EntryData } from "./types";

interface PageProps {
  searchParams: Promise<{ status?: string; sort?: string }>;
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/watchlist");

  const { status: statusParam, sort: sortParam } = await searchParams;

  const activeTab = (
    TABS.find((t) => t.value === statusParam?.toUpperCase())?.value ?? "ALL"
  ) as WatchlistStatus;

  const SORT_KEYS: SortKey[] = ["recent", "rating", "title", "release"];
  const sort = (SORT_KEYS.includes(sortParam as SortKey) ? sortParam : "recent") as SortKey;

  const rawEntries = await prisma.watchlistEntry.findMany({
    where: {
      userId: session.user.id,
      ...(activeTab !== "ALL" ? { status: activeTab } : {}),
    },
    include: {
      anime: {
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          format: true,
          episodes: true,
          averageScore: true,
          seasonYear: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const animeIds = rawEntries.map((e) => e.animeId);
  const ratings =
    animeIds.length > 0
      ? await prisma.rating.findMany({
          where: { userId: session.user.id, animeId: { in: animeIds } },
          select: { animeId: true, score: true },
        })
      : [];
  const ratingMap = Object.fromEntries(ratings.map((r) => [r.animeId, r.score]));

  let entries: EntryData[] = rawEntries.map((e) => ({
    animeId: e.animeId,
    status: e.status,
    progress: e.progress,
    userScore: ratingMap[e.animeId] ?? null,
    updatedAt: e.updatedAt.toISOString(),
    anime: e.anime,
  }));

  switch (sort) {
    case "rating":
      entries.sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0));
      break;
    case "title":
      entries.sort((a, b) => {
        const ta = a.anime.titleEnglish ?? a.anime.title;
        const tb = b.anime.titleEnglish ?? b.anime.title;
        return ta.localeCompare(tb);
      });
      break;
    case "release":
      entries.sort((a, b) => (b.anime.seasonYear ?? 0) - (a.anime.seasonYear ?? 0));
      break;
  }

  const allStatuses = await prisma.watchlistEntry.findMany({
    where: { userId: session.user.id },
    select: { status: true },
  });
  const counts = allStatuses.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <TrackerClient
        entries={entries}
        counts={counts}
        activeTab={activeTab}
        sort={sort}
      />
    </div>
  );
}
