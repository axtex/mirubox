import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { List, Lock } from "lucide-react";
import { RatingBadge } from "@/components/tracker/RatingBadge";
import { ReviewBadge } from "@/components/tracker/ReviewBadge";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getArchiveCounts } from "@/lib/archive";
import { formatActivityLabel, getRecentActivity, timeAgo, xpIcon, type ActivityEvent } from "@/lib/profile";
import { ProfileHeaderActions } from "@/components/profile/ProfileHeaderActions";

// ─── Types ──────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "archive" | "stats" | "reviews" | "lists";

interface GenreEntry { name: string; count: number; pct: number }

interface OverviewData {
  watchingEntries: Array<{
    animeId: number;
    progress: number;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null; episodes: number | null };
  }>;
  xpEvents: ActivityEvent[];
  topGenres: GenreEntry[];
  avgRating: number | null;
}

interface WatchlistTabData {
  inProgress: Array<{
    animeId: number;
    progress: number;
    total: number | null;
    mediaType: string;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null };
  }>;
  recentlyCompleted: Array<{
    animeId: number;
    mediaType: string;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null };
    userScore: number | null;
    hasReview: boolean;
  }>;
  recentlyAdded: Array<{
    animeId: number;
    mediaType: string;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null };
  }>;
  recentlyRated: Array<{
    animeId: number;
    mediaType: string;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null };
    userScore: number;
    hasReview: boolean;
  }>;
  statusCounts: Record<string, number>;
}

interface StatsData {
  topGenres: GenreEntry[];
  ratingBuckets: Record<string, number>;
  completionRate: number;
  completedCount: number;
  startedCount: number;
  totalMinutes: number;
  xpEvents: ActivityEvent[];
  hasWeeklyActivity: boolean;
  avgRating: string | null;
}

interface ProfileListSummary {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface ListsTabData {
  yourLists: ProfileListSummary[];
  likedLists: ProfileListSummary[];
}

interface ReviewsTabData {
  reviews: Array<{
    animeId: number;
    mediaType: string;
    content: string;
    containsSpoilers: boolean;
    updatedAt: Date;
    userScore: number | null;
    anime: { id: number; title: string; titleEnglish: string | null; coverImage: string | null };
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROFILE_TABS: { value: ProfileTab; label: string }[] = [
  { value: "overview",  label: "OVERVIEW" },
  { value: "archive",   label: "ARCHIVE" },
  { value: "stats",     label: "STATS" },
  { value: "reviews",   label: "REVIEWS" },
  { value: "lists",     label: "LISTS" },
];

function getRank(xp: number): string {
  if (xp >= 4000) return "SCHOLAR";
  if (xp >= 1500) return "CURATOR";
  if (xp >= 600)  return "ARCHIVIST";
  if (xp >= 200)  return "TRACKER";
  return "WATCHER";
}

function getActivityDot(reason: string): string {
  if (reason.toLowerCase().includes("rate")) return "var(--score-mid)";
  if (reason.toLowerCase().includes("complet")) return "#4ade80";
  return "var(--primary)";
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const { tab: tabParam } = await searchParams;
  const activeTab: ProfileTab =
    ["overview", "archive", "stats", "reviews", "lists"].includes(tabParam ?? "")
      ? (tabParam as ProfileTab)
      : "overview";

  const userId = session.user.id;

  // Always-needed data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, xp: true, level: true },
  });
  if (!user) redirect("/auth/signin");

  const [archiveCounts, reviewsCount, completedCount, watchedCount, readCount] = await Promise.all([
    getArchiveCounts(userId),
    prisma.review.count({ where: { userId } }),
    prisma.watchlistEntry.count({ where: { userId, status: "COMPLETED" } }),
    prisma.watchlistEntry.count({ where: { userId, status: "COMPLETED", anime: { type: "ANIME" } } }),
    prisma.watchlistEntry.count({ where: { userId, status: "COMPLETED", anime: { type: "MANGA" } } }),
  ]);

  const rank = getRank(user.xp);
  const xpInLevel = user.xp % 100;
  const progressPct = Math.min(100, xpInLevel);

  // Tab-specific data
  let overviewData: OverviewData | null = null;
  let watchlistTabData: WatchlistTabData | null = null;
  let statsData: StatsData | null = null;
  let listsTabData: ListsTabData | null = null;
  let reviewsTabData: ReviewsTabData | null = null;

  if (activeTab === "overview") {
    const [watchingEntries, xpEvents, watchlistForGenres, avgRatingAgg] = await Promise.all([
      prisma.watchlistEntry.findMany({
        where: { userId, status: "IN_PROGRESS" },
        include: { anime: { select: { id: true, title: true, titleEnglish: true, coverImage: true, episodes: true } } },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      getRecentActivity(userId, 6),
      prisma.watchlistEntry.findMany({ where: { userId }, include: { anime: { select: { genres: true } } } }),
      prisma.rating.aggregate({ where: { userId }, _avg: { score: true } }),
    ]);

    const genreCounts: Record<string, number> = {};
    for (const e of watchlistForGenres) {
      for (const g of e.anime.genres) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    }
    const totalG = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalG) * 100) }));

    overviewData = {
      watchingEntries: watchingEntries.map(e => ({
        animeId: e.animeId,
        progress: e.progress,
        anime: e.anime,
      })),
      xpEvents,
      topGenres,
      avgRating: avgRatingAgg._avg.score,
    };
  } else if (activeTab === "archive") {
    const [allEntries, recentRatings, allRatingScores, userReviews] = await Promise.all([
      prisma.watchlistEntry.findMany({
        where: { userId },
        include: {
          anime: { select: { id: true, title: true, titleEnglish: true, coverImage: true, episodes: true, chapters: true, type: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.rating.findMany({
        where: { userId },
        include: {
          anime: { select: { id: true, title: true, titleEnglish: true, coverImage: true, type: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.rating.findMany({ where: { userId }, select: { animeId: true, score: true } }),
      prisma.review.findMany({ where: { userId }, select: { animeId: true } }),
    ]);

    const ratingMap = new Map(allRatingScores.map(r => [r.animeId, r.score]));
    const reviewIds = new Set(userReviews.map(r => r.animeId));

    const statusCounts = allEntries.reduce<Record<string, number>>((acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    }, {});

    const mapAnime = (e: (typeof allEntries)[number]) => ({
      animeId: e.animeId,
      mediaType: e.mediaType,
      anime: {
        id: e.anime.id,
        title: e.anime.title,
        titleEnglish: e.anime.titleEnglish,
        coverImage: e.anime.coverImage,
      },
    });

    const inProgress = allEntries
      .filter(e => e.status === "IN_PROGRESS")
      .slice(0, 4)
      .map(e => ({
        animeId: e.animeId,
        progress: e.progress,
        total: e.total ?? (e.mediaType === "MANGA" ? e.anime.chapters : e.anime.episodes),
        mediaType: e.mediaType,
        anime: { id: e.anime.id, title: e.anime.title, titleEnglish: e.anime.titleEnglish, coverImage: e.anime.coverImage },
      }));

    const recentlyCompleted = allEntries
      .filter(e => e.status === "COMPLETED")
      .slice(0, 4)
      .map(e => ({
        ...mapAnime(e),
        userScore: ratingMap.get(e.animeId) ?? null,
        hasReview: reviewIds.has(e.animeId),
      }));

    const recentlyAdded = [...allEntries]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4)
      .map(mapAnime);

    const recentlyRated = recentRatings.map(r => ({
      animeId: r.animeId,
      mediaType: r.anime.type === "MANGA" ? "MANGA" : "ANIME",
      anime: {
        id: r.anime.id,
        title: r.anime.title,
        titleEnglish: r.anime.titleEnglish,
        coverImage: r.anime.coverImage,
      },
      userScore: r.score,
      hasReview: reviewIds.has(r.animeId),
    }));

    watchlistTabData = { inProgress, recentlyCompleted, recentlyAdded, recentlyRated, statusCounts };
  } else if (activeTab === "stats") {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [watchlistEntries, ratingsList, xpEvents, weeklyActivity] = await Promise.all([
      prisma.watchlistEntry.findMany({ where: { userId }, include: { anime: { select: { genres: true, episodes: true } } } }),
      prisma.rating.findMany({ where: { userId }, select: { score: true } }),
      getRecentActivity(userId, 6),
      prisma.watchlistEntry.findFirst({ where: { userId, updatedAt: { gte: weekStart } }, select: { id: true } }),
    ]);

    const genreCounts: Record<string, number> = {};
    let totalMinutes = 0;
    let startedCount = 0;
    for (const e of watchlistEntries) {
      for (const g of e.anime.genres) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
      if (e.status === "COMPLETED" && e.anime.episodes) totalMinutes += e.anime.episodes * 24;
      if (["IN_PROGRESS", "COMPLETED", "DROPPED"].includes(e.status)) startedCount++;
    }
    const totalG = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalG) * 100) }));

    const ratingBuckets: Record<string, number> = {};
    for (const r of ratingsList) {
      const b = String(Math.floor(r.score));
      ratingBuckets[b] = (ratingBuckets[b] ?? 0) + 1;
    }

    const avgRating = ratingsList.length > 0
      ? (ratingsList.reduce((s, r) => s + r.score, 0) / ratingsList.length).toFixed(1)
      : null;

    statsData = {
      topGenres,
      ratingBuckets,
      completionRate: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
      completedCount,
      startedCount,
      totalMinutes,
      xpEvents,
      hasWeeklyActivity: !!weeklyActivity,
      avgRating,
    };
  } else if (activeTab === "lists") {
    // TODO: load user-created and liked lists once lists feature ships
    listsTabData = { yourLists: [], likedLists: [] };
  } else if (activeTab === "reviews") {
    const [userReviews, userRatings] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          anime: { select: { id: true, title: true, titleEnglish: true, coverImage: true, type: true } },
        },
      }),
      prisma.rating.findMany({
        where: { userId },
        select: { animeId: true, score: true },
      }),
    ]);
    const scoreByAnimeId = new Map(userRatings.map(r => [r.animeId, r.score]));
    reviewsTabData = {
      reviews: userReviews.map(r => ({
        animeId: r.animeId,
        mediaType: r.anime.type === "MANGA" ? "MANGA" : "ANIME",
        content: r.content,
        containsSpoilers: r.containsSpoilers,
        updatedAt: r.updatedAt,
        userScore: scoreByAnimeId.get(r.animeId) ?? null,
        anime: {
          id: r.anime.id,
          title: r.anime.title,
          titleEnglish: r.anime.titleEnglish,
          coverImage: r.anime.coverImage,
        },
      })),
    };
  }

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── PROFILE HEADER + TABS ──────────────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-start gap-4 md:gap-6 pb-8">
          {/* Avatar + name */}
          <div className="flex flex-1 min-w-0 gap-4 md:gap-6">
            <div className="shrink-0">
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={64}
                    height={64}
                    className="object-cover"
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>
                    {(user.name ?? "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span
                className="self-start"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 8,
                  color: "var(--primary)",
                  background: "rgba(232,23,63,0.1)",
                  border: "1px solid rgba(232,23,63,0.2)",
                  borderRadius: 2,
                  padding: "1px 5px",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {rank}
              </span>
              <h1 className="text-headline-md font-display">{user.name ?? "Anime Fan"}</h1>
              {/* TODO: Replace with AI-generated taste summary once taste profile analysis is built */}
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)", fontStyle: "italic" }}>
                Your taste profile is building...
              </p>
            </div>
          </div>

          {/* Actions + stats */}
          <div className="shrink-0 flex flex-col items-end gap-5">
            <ProfileHeaderActions />
            <div className="flex items-start gap-4 md:gap-5">
              {[
                { label: "WATCHED", value: watchedCount },
                { label: "READ", value: readCount },
                { label: "RATED", value: archiveCounts.ratingsCount },
                { label: "REVIEWS", value: reviewsCount },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p style={{ fontSize: 20, fontWeight: 500, color: "#e4e1e6", lineHeight: 1.2 }}>{value}</p>
                  <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-muted)", letterSpacing: "0.06em" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <nav
          className="flex flex-wrap"
          style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
        >
          {PROFILE_TABS.map(({ value, label }, index) => {
            const active = activeTab === value;
            return (
              <Link
                key={value}
                href={`/profile?tab=${value}`}
                className="shrink-0 transition-colors"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  padding: index === 0 ? "12px 16px 12px 0" : "12px 16px",
                  color: active ? "var(--primary)" : "var(--fg-muted)",
                  borderBottom: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </section>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}

      {activeTab === "overview" && overviewData && (
        <OverviewTab data={overviewData} />
      )}

      {activeTab === "archive" && watchlistTabData && (
        <WatchlistTab data={watchlistTabData} />
      )}

      {activeTab === "stats" && statsData && (
        <StatsTab
          data={statsData}
          xp={user.xp}
          level={user.level}
          xpInLevel={xpInLevel}
          progressPct={progressPct}
        />
      )}

      {activeTab === "reviews" && reviewsTabData && <ReviewsTab data={reviewsTabData} />}
      {activeTab === "lists" && listsTabData && <ListsTab data={listsTabData} />}
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: OverviewData }) {
  const { watchingEntries, xpEvents, topGenres, avgRating } = data;
  const maxGenreCount = topGenres[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-10">

      {/* Section A: Continue Watching */}
      {watchingEntries.length > 0 && (
        <section>
          <SectionLabel>CONTINUE</SectionLabel>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {watchingEntries.map(entry => {
              const title = entry.anime.titleEnglish ?? entry.anime.title;
              const progressPct = entry.anime.episodes
                ? Math.round((entry.progress / entry.anime.episodes) * 100)
                : 0;
              return (
                <Link
                  key={entry.animeId}
                  href={`/anime/${entry.anime.id}`}
                  className="shrink-0 flex gap-2.5 p-2.5 transition-all"
                  style={{ width: 220, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, textDecoration: "none" }}
                >
                  <div className="relative shrink-0 overflow-hidden" style={{ width: 44, height: 62, borderRadius: 2 }}>
                    {entry.anime.coverImage && (
                      <Image src={entry.anime.coverImage} alt={title} fill sizes="44px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <p
                      className="line-clamp-2 leading-snug"
                      style={{ fontFamily: "var(--font-anybody)", fontSize: 11, fontWeight: 600, color: "var(--fg)" }}
                    >
                      {title}
                    </p>
                    <div>
                      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-muted)", marginBottom: 4 }}>
                        EP {entry.progress}{entry.anime.episodes ? `/${entry.anime.episodes}` : ""}
                      </p>
                      <div className="w-full overflow-hidden" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--primary)", borderRadius: 1 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Section B: Recent Activity */}
      <section>
        <SectionLabel>RECENT ACTIVITY</SectionLabel>
        {xpEvents.length === 0 ? (
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
            No activity yet.{" "}
            <Link href="/search" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Start tracking →
            </Link>
          </p>
        ) : (
          <div className="flex flex-col">
            {xpEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span style={{ color: getActivityDot(event.reason), fontSize: 10, flexShrink: 0 }}>●</span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatActivityLabel(event)}
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", flexShrink: 0 }}>
                  {timeAgo(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section C: Taste Breakdown */}
      <section>
        <SectionLabel>TASTE BREAKDOWN</SectionLabel>
        {topGenres.length === 0 ? (
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-subtle)" }}>
            Add anime to your watchlist to build a taste profile.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {topGenres.map(g => (
              <div key={g.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)", letterSpacing: "0.06em" }}>
                    {g.name.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>{g.count}</span>
                </div>
                <div className="overflow-hidden" style={{ height: 4, background: "var(--border)", borderRadius: 2, maxWidth: 200 }}>
                  <div style={{ width: `${Math.round((g.count / maxGenreCount) * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }} />
                </div>
              </div>
            ))}
            {avgRating !== null && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 4 }}>
                AVG RATING:{" "}
                <span style={{ color: "var(--fg)" }}>{avgRating.toFixed(1)} / 10</span>
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── WATCHLIST TAB ───────────────────────────────────────────────────────────

function WatchlistTab({ data }: { data: WatchlistTabData }) {
  const { inProgress, recentlyCompleted, recentlyAdded, recentlyRated, statusCounts } = data;
  const totalEntries = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  if (totalEntries === 0 && recentlyRated.length === 0) {
    return (
      <div className="py-12 text-center">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--fg-muted)", marginBottom: 8 }}>
          Nothing tracked yet.
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", maxWidth: 320, margin: "0 auto" }}>
          Start adding anime and manga to your tracker.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Two sections side-by-side */}
      <div className="flex flex-col md:flex-row gap-8">

        {/* IN PROGRESS */}
        {inProgress.length > 0 && (
          <div className="flex-1 min-w-0">
            <SectionLabel>IN PROGRESS</SectionLabel>
            <div className="flex flex-col gap-3">
              {inProgress.map(entry => {
                const title = entry.anime.titleEnglish ?? entry.anime.title;
                const progressLabel = entry.mediaType === "MANGA" ? "CH" : "EP";
                const progressPct = entry.total ? Math.round((entry.progress / entry.total) * 100) : 0;
                const href = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;
                return (
                  <Link
                    key={entry.animeId}
                    href={href}
                    className="flex items-center gap-3"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="relative shrink-0 overflow-hidden" style={{ width: 40, height: 56, borderRadius: 2 }}>
                      {entry.anime.coverImage && (
                        <Image src={entry.anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontFamily: "var(--font-anybody)", fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}
                      >
                        {title}
                      </p>
                      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 4 }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }} />
                      </div>
                      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}>
                        {progressLabel} {entry.progress}{entry.total ? `/${entry.total}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* RECENTLY COMPLETED */}
        {recentlyCompleted.length > 0 && (
          <div className="flex-1 min-w-0">
            <SectionLabel>RECENTLY COMPLETED</SectionLabel>
            <div className="flex flex-col gap-3">
              {recentlyCompleted.map(entry => (
                <ArchiveMediaLink key={entry.animeId} entry={entry} userScore={entry.userScore} hasReview={entry.hasReview} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {recentlyAdded.length > 0 && (
          <div className="flex-1 min-w-0">
            <SectionLabel>RECENTLY ADDED</SectionLabel>
            <div className="flex flex-col gap-3">
              {recentlyAdded.map((entry) => (
                <ArchiveMediaLink key={entry.animeId} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {recentlyRated.length > 0 && (
          <div className="flex-1 min-w-0">
            <SectionLabel>RECENTLY RATED</SectionLabel>
            <div className="flex flex-col gap-3">
              {recentlyRated.map((entry) => (
                <ArchiveMediaLink key={entry.animeId} entry={entry} userScore={entry.userScore} hasReview={entry.hasReview} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View full tracker */}
      <div className="flex justify-end">
        <Link
          href="/watchlist"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--primary)", textDecoration: "none", letterSpacing: "0.06em" }}
        >
          VIEW FULL TRACKER →
        </Link>
      </div>
    </div>
  );
}

// ─── STATS TAB ───────────────────────────────────────────────────────────────

function StatsTab({
  data,
  xp,
  level,
  xpInLevel,
  progressPct,
}: {
  data: StatsData;
  xp: number;
  level: number;
  xpInLevel: number;
  progressPct: number;
}) {
  const maxRatingCount = Math.max(...Object.values(data.ratingBuckets), 1);
  const maxGenreCount = data.topGenres[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-8">

      {/* Streak */}
      <section>
        <SectionLabel>WEEKLY STREAK</SectionLabel>
        {/* TODO: implement full multi-week streak tracking in XP phase */}
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 13, color: data.hasWeeklyActivity ? "var(--fg)" : "var(--fg-muted)" }}>
          {data.hasWeeklyActivity ? "🔥 Active this week" : "No active streak"}
        </p>
      </section>

      {/* XP Progression */}
      <section>
        <SectionLabel>XP PROGRESSION</SectionLabel>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 48, height: 48, background: "var(--primary)", borderRadius: 4, fontFamily: "var(--font-anybody)", fontWeight: 800, fontSize: 22, color: "#fff" }}
          >
            {level}
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)" }}>
                {xpInLevel} / 100 XP TO LEVEL {level + 1}
              </span>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--primary)" }}>
                {progressPct}%
              </span>
            </div>
            <div className="w-full overflow-hidden" style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2 }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }} />
            </div>
            <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)", marginTop: 4 }}>
              {xp} TOTAL XP
            </p>
          </div>
        </div>
        {data.xpEvents.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {data.xpEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-3 py-2"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
              >
                <span style={{ color: "var(--fg-subtle)" }}>{xpIcon(event.reason)}</span>
                <span className="flex-1 truncate" style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}>
                  {formatActivityLabel(event)}
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)", flexShrink: 0 }}>
                  {timeAgo(event.createdAt)}
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--primary)", flexShrink: 0 }}>
                  +{event.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Genre Distribution */}
      <section>
        <SectionLabel>GENRE DISTRIBUTION</SectionLabel>
        {data.topGenres.length === 0 ? (
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-subtle)" }}>No data yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.topGenres.map(g => (
              <div key={g.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)", letterSpacing: "0.06em" }}>
                    {g.name.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>{g.count}</span>
                </div>
                <div className="overflow-hidden" style={{ height: 4, background: "var(--border)", borderRadius: 2, maxWidth: 300 }}>
                  <div style={{ width: `${Math.round((g.count / maxGenreCount) * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rating Distribution */}
      <section>
        <SectionLabel>RATING DISTRIBUTION</SectionLabel>
        {Object.keys(data.ratingBuckets).length === 0 ? (
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-subtle)" }}>No ratings yet.</p>
        ) : (
          <div>
            <div className="flex items-end gap-1.5 mb-2" style={{ height: 60 }}>
              {Array.from({ length: 10 }, (_, i) => {
                const key = String(i + 1);
                const count = data.ratingBuckets[key] ?? 0;
                const h = Math.round((count / maxRatingCount) * 100);
                return (
                  <div key={key} className="flex flex-col items-center gap-0.5 flex-1">
                    <div
                      style={{ width: "100%", height: `${h}%`, minHeight: count > 0 ? 2 : 0, background: "var(--primary)", borderRadius: "1px 1px 0 0", transition: "height 0.3s" }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="flex-1 text-center" style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "var(--fg-subtle)" }}>
                  {i + 1}
                </div>
              ))}
            </div>
            {data.avgRating && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 8 }}>
                AVG RATING: <span style={{ color: "var(--fg)" }}>{data.avgRating} / 10</span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Completion Rate */}
      <section>
        <SectionLabel>COMPLETION RATE</SectionLabel>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 13, color: "var(--fg)", marginBottom: 6 }}>
          {data.completionRate}%
        </p>
        <div className="overflow-hidden mb-2" style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, maxWidth: 240 }}>
          <div style={{ width: `${data.completionRate}%`, height: "100%", background: "#4ade80", borderRadius: 2 }} />
        </div>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)" }}>
          {data.completedCount} COMPLETED OF {data.startedCount} STARTED
        </p>
      </section>

      {/* Badges placeholder */}
      <section>
        <SectionLabel>BADGES</SectionLabel>
        {/* TODO: implement badge system in XP phase */}
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <Lock className="w-4 h-4" style={{ color: "var(--fg-subtle)" }} />
              </div>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "var(--fg-subtle)", letterSpacing: "0.06em" }}>???</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── REVIEWS TAB ─────────────────────────────────────────────────────────────

function ReviewsTab({ data }: { data: ReviewsTabData }) {
  if (data.reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--fg-muted)", marginBottom: 8 }}>
          No reviews yet.
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", maxWidth: 320, margin: "0 auto" }}>
          Reviews you write on anime and manga pages will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.reviews.map(review => {
        const title = review.anime.titleEnglish ?? review.anime.title;
        const href = review.mediaType === "MANGA"
          ? `/manga/${review.animeId}#review`
          : `/anime/${review.animeId}#review`;

        return (
          <Link
            key={review.animeId}
            href={href}
            className="card-base card-hover flex gap-4 p-4"
            style={{ textDecoration: "none" }}
          >
            <div className="relative shrink-0 overflow-hidden" style={{ width: 48, height: 68, borderRadius: 2 }}>
              {review.anime.coverImage && (
                <Image src={review.anime.coverImage} alt={title} fill sizes="48px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p
                  className="truncate"
                  style={{ fontFamily: "var(--font-anybody)", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}
                >
                  {title}
                </p>
                <span className="text-label shrink-0" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                  {timeAgo(review.updatedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {review.userScore != null && (
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--primary)",
                      background: "rgba(232,23,63,0.1)",
                      border: "1px solid rgba(232,23,63,0.2)",
                      borderRadius: 2,
                      padding: "1px 5px",
                    }}
                  >
                    ★ {review.userScore}
                  </span>
                )}
                {review.containsSpoilers && (
                  <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                    SPOILERS
                  </span>
                )}
              </div>
              <p
                className="line-clamp-3"
                style={{
                  fontFamily: "var(--font-anybody)",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "var(--fg-muted)",
                }}
              >
                {review.content}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── LISTS TAB ───────────────────────────────────────────────────────────────

function ListsTab({ data }: { data: ListsTabData }) {
  return (
    <div className="flex flex-col gap-10">
      <ListSection
        title="YOUR LISTS"
        lists={data.yourLists}
        emptyMessage="No lists yet. Create lists to organise and share your picks."
      />
      <ListSection
        title="LIKED LISTS"
        lists={data.likedLists}
        emptyMessage="Lists you like from other members will appear here."
      />
    </div>
  );
}

function ListSection({
  title,
  lists,
  emptyMessage,
}: {
  title: string;
  lists: ProfileListSummary[];
  emptyMessage: string;
}) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      {lists.length === 0 ? (
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map((list) => (
            <ProfileListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileListCard({ list }: { list: ProfileListSummary }) {
  return (
    <Link
      href={list.href}
      className="card-base card-hover flex flex-col gap-3 p-5 min-h-[100px]"
      style={{ textDecoration: "none" }}
    >
      <List className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
      <div>
        <p className="text-label leading-snug" style={{ color: "var(--fg)", fontSize: 10 }}>
          {list.title}
        </p>
        <p className="mt-1.5 text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
          {list.subtitle}
        </p>
      </div>
    </Link>
  );
}

// ─── SHARED ──────────────────────────────────────────────────────────────────

function ArchiveMediaLink({
  entry,
  userScore,
  hasReview = false,
}: {
  entry: {
    animeId: number;
    mediaType: string;
    anime: { title: string; titleEnglish: string | null; coverImage: string | null };
  };
  userScore?: number | null;
  hasReview?: boolean;
}) {
  const title = entry.anime.titleEnglish ?? entry.anime.title;
  const baseHref = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;
  const href = hasReview ? `${baseHref}#review` : baseHref;

  return (
    <Link
      href={href}
      className="flex items-center gap-3"
      style={{ textDecoration: "none" }}
    >
      <div className="relative shrink-0 overflow-hidden" style={{ width: 40, height: 56, borderRadius: 2 }}>
        {entry.anime.coverImage && (
          <Image src={entry.anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontFamily: "var(--font-anybody)", fontSize: 12, fontWeight: 600, color: "var(--fg)" }}
        >
          {title}
        </p>
        {(userScore != null || hasReview) && (
          <div className="flex items-center gap-2 mt-1.5">
            {userScore != null && <RatingBadge score={userScore} className="shrink-0" />}
            {hasReview && <ReviewBadge active className="shrink-0" />}
          </div>
        )}
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", letterSpacing: "0.1em" }}>
        {children}
      </p>
      <div style={{ width: 24, height: 1.5, background: "var(--primary)", marginTop: 4 }} />
    </div>
  );
}
