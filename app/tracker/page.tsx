import Link from "next/link";
import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMediaChaptersByIds } from "@/lib/anilist";
import { TrackerClient } from "./TrackerClient";
import { STATUS_TABS, slugToStatus } from "./types";
import type { TrackerStatus, MediaType, SortKey, EntryData, MediaCounts } from "./types";

interface PageProps {
  searchParams: Promise<{ status?: string; sort?: string; type?: string; favourites?: string }>;
}

const SORT_KEYS: SortKey[] = ["recent", "rating", "title"];

const ANIME_SELECT = {
  id: true, title: true, titleEnglish: true, coverImage: true,
  format: true, episodes: true, chapters: true, volumes: true,
  averageScore: true, seasonYear: true,
} as const;

/** Non-blocking backfill — never hold the tracker page on AniList. */
function scheduleChapterBackfill(ids: number[]): void {
  if (ids.length === 0) return;
  after(() => {
    void (async () => {
      try {
        const rows = await getMediaChaptersByIds(ids);
        await Promise.all(
          rows
            .filter((row) => row.chapters != null)
            .map((row) =>
              prisma.anime.update({
                where: { id: row.id },
                data: { chapters: row.chapters },
              }).catch(() => undefined),
            ),
        );
      } catch {
        // AniList timeouts are common — keep tracker snappy; retry next visit.
      }
    })();
  });
}

export default async function TrackerPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
            <Link
              href="/auth/signin?callbackUrl=/tracker"
              style={{ color: "var(--primary)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Sign in
            </Link>
            {" "}to track titles.
          </p>
        </div>
      </div>
    );
  }

  const { status: statusParam, sort: sortParam, type: typeParam, favourites: favParam } = await searchParams;

  const sort: SortKey = SORT_KEYS.includes(sortParam as SortKey) ? (sortParam as SortKey) : "recent";
  const showFavourites = favParam === "true";
  const mediaType: MediaType = ["anime", "manga"].includes(typeParam?.toLowerCase() ?? "")
    ? (typeParam!.toUpperCase() as MediaType)
    : "ALL";

  const favouriteCountPromise = prisma.favourite.count({ where: { userId: session.user.id } });

  // ── Favourites view ──────────────────────────────────────────────────────────
  if (showFavourites) {
    const [allFavourites, trackerLite, ratingRows, reviewRows, favouriteCount] = await Promise.all([
      prisma.favourite.findMany({
        where: { userId: session.user.id },
        include: { anime: { select: ANIME_SELECT } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.trackerEntry.findMany({
        where: { userId: session.user.id, status: { not: "FAVOURITE" } },
        select: { animeId: true, status: true, mediaType: true, progress: true, total: true, updatedAt: true },
      }),
      prisma.rating.findMany({ where: { userId: session.user.id }, select: { animeId: true, score: true } }),
      prisma.review.findMany({ where: { userId: session.user.id }, select: { animeId: true } }),
      favouriteCountPromise,
    ]);

    const trackerByAnimeId = new Map(trackerLite.map((e) => [e.animeId, e]));
    const ratingMap = new Map(ratingRows.map((r) => [r.animeId, r.score]));
    const reviewIds = new Set(reviewRows.map((r) => r.animeId));

    const entries: EntryData[] = allFavourites.map((fav) => {
      const tracked = trackerByAnimeId.get(fav.mediaId);
      return {
        animeId: fav.mediaId,
        status: tracked?.status ?? "NOT_TRACKED",
        mediaType: tracked?.mediaType ?? fav.mediaType,
        progress: tracked?.progress ?? 0,
        total: tracked?.total ?? null,
        userScore: ratingMap.get(fav.mediaId) ?? null,
        hasReview: reviewIds.has(fav.mediaId),
        updatedAt: (tracked?.updatedAt ?? fav.createdAt).toISOString(),
        anime: fav.anime,
        isFavouriteOnly: !tracked,
      };
    });

    const mediaCounts: MediaCounts = {
      anime: allFavourites.filter((f) => f.mediaType === "ANIME").length,
      manga: allFavourites.filter((f) => f.mediaType === "MANGA").length,
      total: allFavourites.length,
    };

    return (
      <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
        <TrackerClient
          entries={entries}
          counts={{}}
          mediaCounts={mediaCounts}
          mediaType="ALL"
          activeStatus="ALL"
          sort={sort}
          showFavourites
          favouriteCount={favouriteCount}
        />
      </div>
    );
  }

  // ── Normal tracker view ──────────────────────────────────────────────────────
  const slugStatus = statusParam?.toLowerCase().replace(/\s+/g, "-") ?? "";
  const candidateStatus = slugToStatus(slugStatus);
  const activeStatus: TrackerStatus =
    STATUS_TABS.some(t => t.value === candidateStatus) && slugStatus ? candidateStatus : "ALL";

  // Full library once — status/type/sort filter client-side for instant tabs.
  const [rawEntries, statusGroups, mediaGroups, ratings, reviews, favouriteCount] = await Promise.all([
    prisma.trackerEntry.findMany({
      where: {
        userId: session.user.id,
        status: { not: "FAVOURITE" },
      },
      include: {
        anime: {
          select: ANIME_SELECT,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trackerEntry.groupBy({
      by: ["status", "mediaType"],
      where: {
        userId: session.user.id,
        status: { not: "FAVOURITE" },
      },
      _count: { _all: true },
    }),
    prisma.trackerEntry.groupBy({
      by: ["mediaType"],
      where: { userId: session.user.id, status: { not: "FAVOURITE" } },
      _count: { _all: true },
    }),
    prisma.rating.findMany({
      where: { userId: session.user.id },
      select: { animeId: true, score: true },
    }),
    prisma.review.findMany({
      where: { userId: session.user.id },
      select: { animeId: true },
    }),
    favouriteCountPromise,
  ]);

  scheduleChapterBackfill(
    [...new Set(
      rawEntries
        .filter((e) => e.mediaType === "MANGA" && e.anime.chapters == null)
        .map((e) => e.animeId),
    )],
  );

  const ratingMap = new Map(ratings.map(r => [r.animeId, r.score]));
  const reviewIds = new Set(reviews.map(r => r.animeId));

  const entries: EntryData[] = rawEntries.map(e => ({
    animeId: e.animeId,
    status: e.status,
    mediaType: e.mediaType,
    progress: e.progress,
    total: e.total,
    userScore: ratingMap.get(e.animeId) ?? null,
    hasReview: reviewIds.has(e.animeId),
    updatedAt: e.updatedAt.toISOString(),
    anime: e.anime,
  }));

  const countsByType: Record<"ALL" | "ANIME" | "MANGA", Record<string, number>> = {
    ALL: {},
    ANIME: {},
    MANGA: {},
  };
  for (const g of statusGroups) {
    countsByType.ALL[g.status] = (countsByType.ALL[g.status] ?? 0) + g._count._all;
    if (g.mediaType === "ANIME" || g.mediaType === "MANGA") {
      countsByType[g.mediaType][g.status] =
        (countsByType[g.mediaType][g.status] ?? 0) + g._count._all;
    }
  }

  const mediaCounts: MediaCounts = {
    anime: mediaGroups.find((g) => g.mediaType === "ANIME")?._count._all ?? 0,
    manga: mediaGroups.find((g) => g.mediaType === "MANGA")?._count._all ?? 0,
    total: mediaGroups.reduce((sum, g) => sum + g._count._all, 0),
  };

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <TrackerClient
        entries={entries}
        counts={countsByType.ALL}
        countsByType={countsByType}
        mediaCounts={mediaCounts}
        mediaType={mediaType}
        activeStatus={activeStatus}
        sort={sort}
        favouriteCount={favouriteCount}
      />
    </div>
  );
}
