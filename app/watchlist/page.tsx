import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sparkles, LayoutGrid, List } from "lucide-react";
import type { Anime } from "@prisma/client";

type WatchlistStatus = "ALL" | "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";

const TABS: { value: WatchlistStatus; label: string }[] = [
  { value: "ALL",           label: "ALL" },
  { value: "WATCHING",      label: "WATCHING" },
  { value: "COMPLETED",     label: "COMPLETED" },
  { value: "PLAN_TO_WATCH", label: "PLAN TO WATCH" },
  { value: "ON_HOLD",       label: "ON HOLD" },
  { value: "DROPPED",       label: "DROPPED" },
];

const STATUS_COLORS: Record<string, string> = {
  WATCHING:      "#3b82f6",
  COMPLETED:     "#4ade80",
  PLAN_TO_WATCH: "#e4e1e6",
  DROPPED:       "#e61e2a",
  ON_HOLD:       "#fbbf24",
};

interface PageProps {
  searchParams: Promise<{ status?: string; view?: string }>;
}

function scoreLabel(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/watchlist");

  const { status: statusParam, view } = await searchParams;
  const activeTab = (TABS.find((t) => t.value === statusParam?.toUpperCase())?.value ?? "ALL") as WatchlistStatus;
  const isListView = view === "list";

  const entries = await prisma.watchlistEntry.findMany({
    where: {
      userId: session.user.id,
      ...(activeTab !== "ALL" ? { status: activeTab } : {}),
    },
    include: { anime: true },
    orderBy: { updatedAt: "desc" },
  });

  const allEntries = await prisma.watchlistEntry.findMany({
    where: { userId: session.user.id },
    select: { status: true },
  });

  const counts = allEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalCount = allEntries.length;

  const watchingCount = counts["WATCHING"] ?? 0;

  function tabHref(value: WatchlistStatus) {
    const base = value === "ALL" ? "/watchlist" : `/watchlist?status=${value}`;
    return isListView ? `${base}${value === "ALL" ? "?" : "&"}view=list` : base;
  }

  return (
    <div className="px-4 md:px-8 py-8 min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-headline-lg font-display uppercase">MY WATCHLIST</h1>
          <div className="flex items-center gap-3 mt-2 text-label" style={{ color: "var(--fg-subtle)" }}>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }}
              />
              {watchingCount} CURRENTLY WATCHING
            </span>
            <span>·</span>
            <span>{totalCount} TOTAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-1">
          {/* View toggle */}
          <Link
            href={isListView ? tabHref(activeTab).replace("view=list", "").replace(/[?&]$/, "") : `${tabHref(activeTab)}${tabHref(activeTab).includes("?") ? "&" : "?"}view=list`}
            className="p-2 transition-colors"
            style={{
              color: isListView ? "var(--primary)" : "var(--fg-subtle)",
              borderRadius: 2,
              border: "1px solid var(--border)",
            }}
            title={isListView ? "Grid view" : "List view"}
          >
            {isListView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </Link>

          <Link href="/search" className="btn-primary" style={{ minHeight: 36, padding: "7px 14px", fontSize: 10 }}>
            + ADD ENTRY
          </Link>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex scroll-row gap-1.5 mb-8">
        {TABS.map(({ value, label }) => {
          const count = value === "ALL" ? totalCount : (counts[value] ?? 0);
          const active = activeTab === value;
          return (
            <Link
              key={value}
              href={tabHref(value)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 transition-all text-label"
              style={{
                background: active ? "var(--primary)" : "var(--bg-card)",
                color: active ? "#fff" : "var(--fg-muted)",
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 2,
                whiteSpace: "nowrap",
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-[9px] px-1 min-w-[16px] text-center"
                  style={{
                    background: active ? "rgba(255,255,255,0.25)" : "var(--bg-elevated)",
                    color: active ? "#fff" : "var(--fg-subtle)",
                    borderRadius: 2,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span style={{ fontSize: 48, opacity: 0.1, fontFamily: "var(--font-anybody)" }}>✦</span>
          <p className="text-label" style={{ color: "var(--fg-muted)" }}>NOTHING HERE YET</p>
          <Link href="/search" className="btn-primary" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
            FIND SOMETHING TO WATCH →
          </Link>
        </div>
      )}

      {/* ── List view ────────────────────────────────────────────────── */}
      {isListView && entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map(({ anime, status, progress }) => (
            <ListRow key={anime.id} anime={anime} status={status} progress={progress} />
          ))}
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────── */}
      {!isListView && entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {entries.map(({ anime, status, progress }) => (
            <GridCard key={anime.id} anime={anime} status={status} progress={progress} />
          ))}

          {/* Discovery card */}
          <Link
            href="/search?sort=POPULARITY_DESC"
            className="flex flex-col items-center justify-center gap-3 p-4 text-center transition-all group"
            style={{
              border: "1px dashed var(--border-bright)",
              borderRadius: 4,
              background: "var(--bg-surface)",
              minHeight: 200,
            }}
          >
            <Sparkles className="w-6 h-6 transition-colors" style={{ color: "var(--fg-subtle)" }} />
            <div>
              <p className="text-label" style={{ color: "var(--fg-muted)" }}>DISCOVERY</p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-subtle)" }}>Suggested for you</p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Load more ────────────────────────────────────────────────── */}
      {entries.length >= 20 && (
        <div className="flex justify-center mt-10">
          <button className="btn-ghost">LOAD MORE TITLES</button>
        </div>
      )}
    </div>
  );
}

function GridCard({ anime, status, progress }: { anime: Anime; status: string; progress: number }) {
  const title = anime.titleEnglish ?? anime.title ?? "Unknown";
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-muted)";
  const scoreClass = scoreLabel(anime.averageScore);
  const progressPct = anime.episodes ? Math.round((progress / anime.episodes) * 100) : 0;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block overflow-hidden transition-all"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      {/* Poster */}
      <div className="relative" style={{ aspectRatio: "2/3", overflow: "hidden" }}>
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        {/* Status badge */}
        <div
          className="absolute bottom-2 left-2 text-label"
          style={{
            background: dotColor,
            color: status === "PLAN_TO_WATCH" ? "#000" : "#fff",
            padding: "2px 6px",
            borderRadius: 2,
            fontSize: 8,
          }}
        >
          {status.replace(/_/g, " ")}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium leading-snug line-clamp-1 mb-1"
          style={{ fontFamily: "var(--font-anybody)", color: "var(--fg)" }}>
          {title}
        </p>

        <div className="flex items-center justify-between mb-1.5">
          {anime.averageScore !== null && (
            <span className={`score-badge ${scoreClass}`}>★ {anime.averageScore}</span>
          )}
          {anime.episodes !== null && (
            <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
              {progress}/{anime.episodes} EPS
            </span>
          )}
        </div>

        {/* Progress bar */}
        {anime.episodes !== null && status === "WATCHING" && (
          <div className="w-full overflow-hidden" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progressPct}%`, background: "var(--secondary)", borderRadius: 1 }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

function ListRow({ anime, status, progress }: { anime: Anime; status: string; progress: number }) {
  const title = anime.titleEnglish ?? anime.title ?? "Unknown";
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-subtle)";
  const scoreClass = scoreLabel(anime.averageScore);

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="flex items-center gap-3 p-3 transition-all"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative shrink-0 overflow-hidden" style={{ width: 48, height: 68, borderRadius: 2 }}>
        {anime.coverImage ? (
          <Image src={anime.coverImage} alt={title} fill sizes="48px" className="object-cover" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--fg)", fontFamily: "var(--font-anybody)" }}>{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
          <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
            {status.replace(/_/g, " ")}
          </span>
          {anime.episodes && status === "WATCHING" && (
            <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
              {progress}/{anime.episodes} EPS
            </span>
          )}
        </div>
      </div>

      {anime.averageScore !== null && (
        <span className={`score-badge ${scoreClass} shrink-0`}>★ {anime.averageScore}</span>
      )}
    </Link>
  );
}
