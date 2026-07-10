import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { getMediaById } from "@/lib/anilist";
import { TrackerClient } from "./TrackerClient";
import { STATUS_TABS, slugToStatus } from "./types";
import type { TrackerStatus, MediaType, SortKey, EntryData, MediaCounts } from "./types";

interface PageProps {
  searchParams: Promise<{ status?: string; sort?: string; type?: string; favourites?: string }>;
}

const SORT_KEYS: SortKey[] = ["recent", "rating", "title", "release"];

const ANIME_SELECT = {
  id: true, title: true, titleEnglish: true, coverImage: true,
  format: true, episodes: true, chapters: true, volumes: true,
  averageScore: true, seasonYear: true,
} as const;

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
    const [allFavourites, ratingRows, reviewRows, favouriteCount] = await Promise.all([
      prisma.favourite.findMany({
        where: { userId: session.user.id },
        include: { anime: { select: ANIME_SELECT } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rating.findMany({ where: { userId: session.user.id }, select: { animeId: true, score: true } }),
      prisma.review.findMany({ where: { userId: session.user.id }, select: { animeId: true } }),
      favouriteCountPromise,
    ]);

    const favIds = allFavourites.map((f) => f.mediaId);
    const trackerEntriesForFavs = favIds.length > 0
      ? await prisma.trackerEntry.findMany({
          where: { userId: session.user.id, animeId: { in: favIds }, status: { not: "FAVOURITE" } },
          select: { animeId: true, status: true, mediaType: true, progress: true, total: true, updatedAt: true },
        })
      : [];

    const trackerByAnimeId = new Map(trackerEntriesForFavs.map((e) => [e.animeId, e]));
    const ratingMap = new Map(ratingRows.map((r) => [r.animeId, r.score]));
    const reviewIds = new Set(reviewRows.map((r) => r.animeId));

    const allEntries: EntryData[] = allFavourites.map((fav) => {
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

    const entries = allEntries;

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

  const typeFilter = mediaType !== "ALL" ? { mediaType } : {};

  const [rawEntries, allEntryMeta, ratings, reviews, favouriteCount] = await Promise.all([
    prisma.trackerEntry.findMany({
      where: {
        userId: session.user.id,
        status: { not: "FAVOURITE" },
        ...(activeStatus !== "ALL" ? { status: activeStatus } : {}),
        ...typeFilter,
      },
      include: {
        anime: {
          select: ANIME_SELECT,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trackerEntry.findMany({
      where: { userId: session.user.id, status: { not: "FAVOURITE" } },
      select: { status: true, mediaType: true },
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

  // Backfill chapter counts for cached manga missing them
  const mangaNeedingChapters = rawEntries.filter(
    (e) => e.mediaType === "MANGA" && e.anime.chapters == null,
  );
  if (mangaNeedingChapters.length > 0) {
    await Promise.all(
      mangaNeedingChapters.map(async (entry) => {
        const media = await getMediaById(entry.animeId);
        if (!media?.chapters) return;
        await cacheAnimeCard(media);
        entry.anime.chapters = media.chapters;
      }),
    );
  }

  const ratingMap = new Map(ratings.map(r => [r.animeId, r.score]));
  const reviewIds = new Set(reviews.map(r => r.animeId));

  let entries: EntryData[] = rawEntries.map(e => ({
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

  if (sort === "rating")  entries.sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0));
  if (sort === "title")   entries.sort((a, b) => (a.anime.titleEnglish ?? a.anime.title).localeCompare(b.anime.titleEnglish ?? b.anime.title));
  if (sort === "release") entries.sort((a, b) => (b.anime.seasonYear ?? 0) - (a.anime.seasonYear ?? 0));

  const counts = allEntryMeta.reduce<Record<string, number>>((acc, e) => {
    if (mediaType === "ALL" || e.mediaType === mediaType) {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
    }
    return acc;
  }, {});

  const mediaCounts: MediaCounts = {
    anime: allEntryMeta.filter(e => e.mediaType === "ANIME").length,
    manga: allEntryMeta.filter(e => e.mediaType === "MANGA").length,
    total: allEntryMeta.length,
  };

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <TrackerClient
        entries={entries}
        counts={counts}
        mediaCounts={mediaCounts}
        mediaType={mediaType}
        activeStatus={activeStatus}
        sort={sort}
        favouriteCount={favouriteCount}
      />
    </div>
  );
}
