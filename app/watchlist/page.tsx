import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDisplayTitle } from "@/lib/anilist";
import type { Anime } from "@prisma/client";

type WatchlistStatus =
  | "ALL"
  | "WATCHING"
  | "COMPLETED"
  | "PLAN_TO_WATCH"
  | "ON_HOLD"
  | "DROPPED";

const TABS: { value: WatchlistStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DROPPED", label: "Dropped" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function scoreClass(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/watchlist");

  const { status: statusParam } = await searchParams;
  const activeTab = (TABS.find((t) => t.value === statusParam?.toUpperCase())?.value ??
    "ALL") as WatchlistStatus;

  const entries = await prisma.watchlistEntry.findMany({
    where: {
      userId: session.user.id,
      ...(activeTab !== "ALL" ? { status: activeTab } : {}),
    },
    include: { anime: true },
    orderBy: { updatedAt: "desc" },
  });

  // Count by status for badges
  const allEntries = await prisma.watchlistEntry.findMany({
    where: { userId: session.user.id },
    select: { status: true },
  });

  const counts = allEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalCount = allEntries.length;

  return (
    <div className="px-4 md:px-8 py-6" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        My Watchlist
      </h1>

      {/* Tabs */}
      <div className="scroll-row gap-1 mb-8 pb-0">
        {TABS.map(({ value, label }) => {
          const count = value === "ALL" ? totalCount : (counts[value] ?? 0);
          const active = activeTab === value;
          return (
            <Link
              key={value}
              href={value === "ALL" ? "/watchlist" : `/watchlist?status=${value}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: active ? "var(--accent)" : "var(--bg-card)",
                color: active ? "#fff" : "var(--fg-muted)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                  style={{
                    background: active ? "rgba(255,255,255,0.25)" : "var(--bg-elevated)",
                    color: active ? "#fff" : "var(--fg-subtle)",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-4xl opacity-20">✦</span>
          <p style={{ color: "var(--fg-muted)" }} className="text-center">
            Nothing here yet.
          </p>
          <Link href="/" className="btn-primary">
            Find something to watch →
          </Link>
        </div>
      )}

      {/* Mobile: list view */}
      <div className="flex flex-col gap-3 md:hidden">
        {entries.map(({ anime, status, progress }) => (
          <WatchlistItem
            key={anime.id}
            anime={anime}
            status={status}
            progress={progress}
          />
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {entries.map(({ anime, status }) => (
          <Link
            key={anime.id}
            href={`/anime/${anime.id}`}
            className="relative group block overflow-hidden card-base card-hover"
          >
            <div className="relative" style={{ height: 225 }}>
              {anime.coverImage ? (
                <Image
                  src={anime.coverImage}
                  alt={anime.title}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
              <div
                className="absolute bottom-0 left-0 right-0 px-2 py-1"
                style={{ background: "rgba(13,13,18,0.85)" }}
              >
                <span
                  className="text-xs"
                  style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
                >
                  {status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <div className="px-2 py-2">
              <p className="text-xs font-medium truncate" style={{ color: "var(--fg-muted)" }}>
                {anime.title}
              </p>
              {anime.averageScore !== null && (
                <span className={`score-badge ${scoreClass(anime.averageScore)} mt-1`}>
                  ★ {anime.averageScore}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WatchlistItem({
  anime,
  status,
  progress,
}: {
  anime: Anime;
  status: string;
  progress: number;
}) {
  const title =
    anime.titleEnglish ??
    anime.title ??
    "Unknown";

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="flex items-center gap-3 p-3 card-base rounded-lg transition-all"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="relative shrink-0 rounded overflow-hidden"
        style={{ width: 48, height: 68 }}
      >
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--fg)" }}
        >
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="badge"
            style={{ fontSize: "10px", padding: "1px 6px" }}
          >
            {status.replace(/_/g, " ")}
          </span>
          {anime.episodes !== null && status === "WATCHING" && (
            <span
              className="text-xs"
              style={{
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {progress}/{anime.episodes} eps
            </span>
          )}
        </div>
      </div>
      {anime.averageScore !== null && (
        <span className={`score-badge ${scoreClass(anime.averageScore)} shrink-0`}>
          {anime.averageScore}
        </span>
      )}
    </Link>
  );
}
