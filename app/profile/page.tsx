import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Folder, Star, Eye, CheckCircle, Settings } from "lucide-react";
import type { XpEvent } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHARACTER_ROSTER } from "@/lib/characters";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function xpIcon(reason: string) {
  if (reason.toLowerCase().includes("rate")) return <Star className="w-3.5 h-3.5" />;
  if (reason.toLowerCase().includes("complet")) return <CheckCircle className="w-3.5 h-3.5" />;
  return <Eye className="w-3.5 h-3.5" />;
}

function pad(n: number | string): string {
  return String(n).padStart(2, "0");
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      xp: true,
      level: true,
      createdAt: true,
      _count: { select: { watchlist: true, ratings: true } },
    },
  });

  if (!user) redirect("/auth/signin");

  const [completedCount, avgRating, xpEvents, watchlistWithGenres, watchingCount] =
    await Promise.all([
      prisma.watchlistEntry.count({ where: { userId: user.id, status: "COMPLETED" } }),
      prisma.rating.aggregate({ where: { userId: user.id }, _avg: { score: true } }),
      prisma.xpEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.watchlistEntry.findMany({
        where: { userId: user.id },
        include: { anime: { select: { genres: true, episodes: true } } },
      }),
      prisma.watchlistEntry.count({ where: { userId: user.id, status: "WATCHING" } }),
    ]);

  const genreCounts: Record<string, number> = {};
  let totalMinutes = 0;
  for (const entry of watchlistWithGenres) {
    for (const g of entry.anime.genres) {
      genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    }
    if (entry.status === "COMPLETED" && entry.anime.episodes) {
      totalMinutes += entry.anime.episodes * 24;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g]) => g);

  const xpInLevel = user.xp % 100;
  const progressPct = Math.min(100, xpInLevel);
  const xpToNext = 100 - xpInLevel;

  const avgScore = avgRating._avg.score ? avgRating._avg.score.toFixed(1) : null;

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto" style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Profile header ───────────────────────────────────────────── */}
      <div className="flex items-start gap-5 mb-8">
        {/* Avatar with gradient border */}
        <div className="relative shrink-0">
          <div
            className="p-[3px] rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
              borderRadius: 8,
            }}
          >
            <div className="overflow-hidden" style={{ width: 88, height: 88, borderRadius: 6 }}>
              {user.image ? (
                <Image src={user.image} alt={user.name ?? "User"} width={88} height={88} className="object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-anybody)" }}
                >
                  {(user.name ?? "U")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center"
            style={{ background: "var(--bg-card-high)", border: "1px solid var(--border-bright)", borderRadius: "50%" }}
          >
            <Settings className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-label mb-1" style={{ color: "var(--primary)" }}>PREMIUM ARCHIVIST</p>
          <h1 className="text-headline-lg font-display">{user.name ?? "Anime Fan"}</h1>
          <p className="mt-1 text-label" style={{ color: "var(--fg-subtle)" }}>
            MEMBER SINCE {user.createdAt.getFullYear()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Link href="#" className="p-2" style={{ color: "var(--fg-subtle)", borderRadius: 2, border: "1px solid var(--border)" }}>
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── XP / Level card ──────────────────────────────────────────── */}
      <div className="mb-6 p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: level badge */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 56, height: 56,
                background: "var(--primary)",
                borderRadius: 2,
                fontFamily: "var(--font-anybody)",
                fontWeight: 800,
                fontSize: 28,
                color: "#fff",
              }}
            >
              {user.level}
            </div>
            <div>
              <p className="text-headline-md font-display">LEVEL {user.level}</p>
              <p className="text-label mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                {user.xp} XP ACROSS {user._count.watchlist} SERIES
              </p>
            </div>
          </div>

          {/* Right: progress */}
          <div className="flex-1 max-w-xs hidden md:block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
                {xpInLevel} / 100 XP TO LEVEL {user.level + 1}
              </span>
              <span className="text-label" style={{ color: "var(--primary)" }}>
                {progressPct}%
              </span>
            </div>
            <div className="w-full overflow-hidden" style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2 }}>
              <div
                className="h-full transition-all"
                style={{ width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }}
              />
            </div>
            <p className="text-label mt-1" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
              {xpToNext} XP NEEDED
            </p>
          </div>
        </div>

        {/* Mobile progress */}
        <div className="mt-4 md:hidden">
          <div className="flex justify-between mb-1">
            <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{xpInLevel} / 100 XP</span>
            <span className="text-label" style={{ color: "var(--primary)", fontSize: 9 }}>{progressPct}% COMPLETE</span>
          </div>
          <div className="w-full overflow-hidden" style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2 }}>
            <div className="h-full" style={{ width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* ── Digital Archive stats ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="section-header">
          <div className="section-header-row">
            <h2 className="text-headline-md font-display flex items-center gap-2 uppercase">
              <Folder className="w-5 h-5" style={{ color: "var(--primary)" }} />
              DIGITAL ARCHIVE
            </h2>
          </div>
          <div className="section-underline" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "TRACKED",   value: pad(user._count.watchlist), sub: "ACTIVE FILES" },
            { label: "FINISHED",  value: pad(completedCount),        sub: "SEALED RECORDS" },
            { label: "WATCHING",  value: pad(watchingCount),         sub: "CURRENT STREAM" },
            { label: "SCORES",    value: avgScore ?? "—",            sub: "AVG MAGNITUDE" },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="relative p-4 flex flex-col gap-1"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
            >
              <p className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{label}</p>
              <p
                className="font-display"
                style={{ fontFamily: "var(--font-anybody)", fontSize: 36, fontWeight: 800, lineHeight: 1, color: "var(--fg)" }}
              >
                {value}
              </p>
              <p className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{sub}</p>
              <span
                className="absolute bottom-3 right-3 text-label"
                style={{ color: "var(--fg-subtle)", fontSize: 14 }}
              >→</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Social stats row (static) ────────────────────────────────── */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-8 px-4 py-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4 }}
      >
        <div className="flex flex-wrap items-center gap-3 text-label" style={{ color: "var(--fg-subtle)" }}>
          <span>#-- LEADERBOARD</span>
          <span>·</span>
          <span>0 LIKES</span>
          <span>·</span>
          <span>0 REPLIES</span>
          <span>·</span>
          <span>0 FRIENDS</span>
        </div>
        <Link href="/watchlist" className="btn-ghost shrink-0" style={{ minHeight: 32, padding: "5px 12px", fontSize: 9 }}>
          YOUR LISTS →
        </Link>
      </div>

      {/* ── Three-column section ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Col 1: Top genres */}
        <div>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>TOP GENRES</p>
          <div className="flex flex-wrap gap-2">
            {topGenres.length > 0
              ? topGenres.map((g) => (
                  <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className="genre-chip">{g}</Link>
                ))
              : <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO DATA YET</p>
            }
          </div>
        </div>

        {/* Col 2: Score breakdown (static bars) */}
        <div>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>SCORE</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "CLASSICS", pct: Math.min(100, completedCount * 3) },
              { label: "SEASONAL", pct: Math.min(100, watchingCount * 8) },
              { label: "OVERALL",  pct: progressPct },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{label}</span>
                  <span className="text-label" style={{ color: "var(--fg-muted)", fontSize: 9 }}>{pct}%</span>
                </div>
                <div className="w-full overflow-hidden" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: "var(--primary)", borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Watched time */}
        <div>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>WATCHED TIME</p>
          <p
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-anybody)", fontSize: 40, fontWeight: 800, lineHeight: 1, color: "var(--fg)" }}
          >
            {totalMinutes.toLocaleString()}
          </p>
          <p className="text-label" style={{ color: "var(--fg-subtle)" }}>TOTAL MINUTES RECORDED</p>
        </div>
      </div>

      {/* ── Two-column: XP History + Characters ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* XP History */}
        <div>
          <div className="section-header">
            <div className="section-header-row">
              <h2 className="text-headline-md font-display flex items-center gap-2 uppercase">
                <Clock className="w-4 h-4" style={{ color: "var(--primary)" }} />
                XP HISTORY
              </h2>
            </div>
            <div className="section-underline" />
          </div>

          {xpEvents.length === 0 ? (
            <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO ACTIVITY YET</p>
          ) : (
            <div className="flex flex-col">
              {xpEvents.map((event: XpEvent) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--fg-subtle)" }}>{xpIcon(event.reason)}</span>
                  <span className="flex-1 text-sm truncate" style={{ color: "var(--fg-muted)" }}>
                    {event.reason}
                  </span>
                  <span className="text-label shrink-0" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                    {timeAgo(event.createdAt)}
                  </span>
                  <span className="text-label shrink-0" style={{ color: "var(--primary)" }}>
                    +{event.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ledger Status (decorative) */}
        <div>
          <div className="section-header">
            <div className="section-header-row">
              <h2 className="text-headline-md font-display uppercase">TOP 3</h2>
              <Link href="/profile#characters" className="text-label" style={{ color: "var(--fg-subtle)" }}>
                VIEW ALL →
              </Link>
            </div>
            <div className="section-underline" />
          </div>

          {/* Top 3 characters */}
          <div className="flex gap-3 mb-5">
            {CHARACTER_ROSTER.slice(0, 3).map((char) => {
              const isUnlocked = user.xp >= char.xpRequired;
              return (
                <div
                  key={char.id}
                  className="flex-1 flex flex-col items-center gap-2 p-3"
                  style={{
                    background: isUnlocked ? `${char.accentColor}11` : "var(--bg-card)",
                    border: `1px solid ${isUnlocked ? char.accentColor + "55" : "var(--border)"}`,
                    borderRadius: 4,
                    opacity: isUnlocked ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontSize: 32 }}>{isUnlocked ? char.avatarEmoji : "🔒"}</span>
                  <p className="text-[10px] text-center" style={{ fontFamily: "var(--font-anybody)", color: isUnlocked ? "var(--fg)" : "var(--fg-subtle)" }}>
                    {isUnlocked ? char.name : "LOCKED"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Ledger status — decorative */}
          <div
            className="p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
          >
            <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>LEDGER STATUS</p>
            {[
              { label: "Integrity", value: "99.8%" },
              { label: "Uptime",    value: "428h" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--fg-muted)" }}>{label}</span>
                <span className="text-label" style={{ color: "var(--score-high)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Character roster ─────────────────────────────────────────── */}
      <div id="characters">
        <div className="section-header">
          <div className="section-header-row">
            <h2 className="text-headline-md font-display uppercase">YOUR CHARACTERS</h2>
          </div>
          <div className="section-underline" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHARACTER_ROSTER.map((char) => {
            const isUnlocked = user.xp >= char.xpRequired;
            const unlockPct = Math.min(100, Math.round((user.xp / char.xpRequired) * 100));

            return (
              <div
                key={char.id}
                className="flex flex-col items-center gap-2 p-4 text-center"
                style={{
                  background: isUnlocked ? `${char.accentColor}11` : "var(--bg-card)",
                  border: `1px solid ${isUnlocked ? char.accentColor + "55" : "var(--border)"}`,
                  borderRadius: 4,
                }}
              >
                <span style={{ fontSize: 40, opacity: isUnlocked ? 1 : 0.3 }}>
                  {isUnlocked ? char.avatarEmoji : "🔒"}
                </span>

                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      fontFamily: "var(--font-anybody)",
                      color: isUnlocked ? "var(--fg)" : "var(--fg-subtle)",
                    }}
                  >
                    {char.name}
                  </p>
                  <p className="text-label mt-0.5" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                    {char.anime}
                  </p>
                </div>

                {isUnlocked ? (
                  <span
                    className="text-label px-2 py-0.5"
                    style={{ background: char.accentColor, color: "#fff", borderRadius: 2, fontSize: 9 }}
                  >
                    UNLOCKED
                  </span>
                ) : (
                  <>
                    <p className="text-label" style={{ color: "var(--primary)", fontSize: 9 }}>
                      UNLOCK AT {char.xpRequired} XP
                    </p>
                    <div className="w-full overflow-hidden" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
                      <div className="h-full" style={{ width: `${unlockPct}%`, background: char.accentColor, borderRadius: 1 }} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
