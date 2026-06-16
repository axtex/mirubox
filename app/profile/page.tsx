import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Settings,
  Share2,
  ShieldCheck,
  List,
  Lock,
} from "lucide-react";
import type { XpEvent } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHARACTER_ROSTER } from "@/lib/characters";
import { timeAgo, xpIcon } from "@/lib/profile";
import { getArchiveCounts } from "@/lib/archive";
import { ArchiveFolderCard } from "@/components/profile/ArchiveFolderCard";

function SectionHeader({
  title,
  href,
  icon,
}: {
  title: string;
  href?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="section-header mb-4">
      <div className="section-header-row">
        <h2 className="text-headline-md font-display flex items-center gap-2 uppercase">
          {icon}
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-label link-subtle" style={{ fontSize: 9 }}>
            VIEW ALL →
          </Link>
        )}
      </div>
      <div className="section-underline" />
    </div>
  );
}

function StatBox({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`p-4 h-full ${className}`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
    >
      {children}
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      createdAt: true,
      _count: { select: { watchlist: true } },
    },
  });

  if (!user) redirect("/auth/signin");

  const [archiveCounts, avgRating, xpEvents, watchlistWithGenres, watchingCount] =
    await Promise.all([
      getArchiveCounts(user.id),
      prisma.rating.aggregate({ where: { userId: user.id }, _avg: { score: true } }),
      prisma.xpEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.watchlistEntry.findMany({
        where: { userId: user.id },
        include: { anime: { select: { genres: true, episodes: true, type: true } } },
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
  const avgScore = archiveCounts.avgScore ?? avgRating._avg.score?.toFixed(1) ?? null;
  const completedCount = watchlistWithGenres.filter((e) => e.status === "COMPLETED").length;
  const classicsPct = Math.min(100, completedCount * 22 || 0);
  const seasonalPct = Math.min(100, watchingCount * 14 || 0);

  const previewCharacters = Array.from({ length: 6 }, (_, i) => CHARACTER_ROSTER[i] ?? null);

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-6">
        <div className="relative shrink-0">
          <div
            className="p-[3px]"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
              borderRadius: 8,
              boxShadow: "0 0 24px var(--primary-glow)",
            }}
          >
            <div className="overflow-hidden" style={{ width: 96, height: 96, borderRadius: 6 }}>
              {user.image ? (
                <Image src={user.image} alt={user.name ?? "User"} width={96} height={96} className="object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ background: "var(--bg-elevated)", color: "var(--primary-dim)", fontFamily: "var(--font-anybody)" }}
                >
                  {(user.name ?? "U")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center"
            style={{ background: "var(--primary)", borderRadius: "50%", border: "2px solid var(--bg)" }}
          >
            <ShieldCheck className="w-3 h-3" style={{ color: "#fff" }} />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <p className="text-label mb-1" style={{ color: "var(--fg-subtle)" }}>
            MEMBER SINCE {user.createdAt.getFullYear()}
          </p>
          <h1 className="text-headline-lg font-display">{user.name ?? "Anime Fan"}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="#"
            className="p-2.5"
            style={{ color: "var(--fg-subtle)", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <span
            className="p-2.5 inline-flex"
            style={{ color: "var(--fg-subtle)", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
            aria-hidden
          >
            <Share2 className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Archive */}
      <div className="mb-6">
        <SectionHeader title="ARCHIVE" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ArchiveFolderCard folder="all" value={String(archiveCounts.all)} />
          <ArchiveFolderCard folder="watching" value={String(archiveCounts.watching)} />
          <ArchiveFolderCard folder="reading" value={String(archiveCounts.reading)} />
          <ArchiveFolderCard folder="ratings" value={avgScore ?? "—"} accent />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatBox>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>TOP GENRES</p>
          <div className="flex flex-wrap gap-2">
            {topGenres.length > 0
              ? topGenres.map((g) => (
                  <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className="genre-chip">
                    {g}
                  </Link>
                ))
              : <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO DATA YET</p>}
          </div>
        </StatBox>

        <StatBox>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>SCORE</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "CLASSICS", pct: classicsPct, color: "var(--fg)" },
              { label: "SEASONAL", pct: seasonalPct, color: "var(--primary)" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{label}</span>
                  <span className="text-label" style={{ color: "var(--fg-muted)", fontSize: 9 }}>{pct}%</span>
                </div>
                <div className="w-full overflow-hidden" style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 1 }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: color, borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </StatBox>

        <StatBox>
          <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>WATCHED TIME</p>
          <p
            className="font-display mb-1"
            style={{ fontFamily: "var(--font-anybody)", fontSize: 40, fontWeight: 800, lineHeight: 1, color: "var(--fg)" }}
          >
            {totalMinutes.toLocaleString()}
          </p>
          <p className="text-label" style={{ color: "var(--fg-subtle)" }}>TOTAL MINUTES RECORDED</p>
        </StatBox>
      </div>

      {/* Social bar + your lists */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 px-4 py-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4 }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label" style={{ color: "var(--fg-subtle)" }}>
          <span>
            <span style={{ color: "var(--primary)" }}>#--</span> LEADERBOARD
          </span>
          <span>0 LIKES</span>
          <span>0 REPLIES</span>
          <span>0 FRIENDS</span>
        </div>
        <Link
          href="/watchlist"
          className="btn-ghost shrink-0 flex items-center gap-2 self-start sm:self-auto"
          style={{ minHeight: 36, padding: "6px 14px", fontSize: 9 }}
        >
          <List className="w-3.5 h-3.5" />
          YOUR LISTS
        </Link>
      </div>

      {/* Level bar */}
      <div className="mb-6 p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                background: "var(--primary)",
                borderRadius: 4,
                fontFamily: "var(--font-anybody)",
                fontWeight: 800,
                fontSize: 28,
                color: "#fff",
              }}
            >
              {user.level}
            </div>
            <div>
              <p className="text-headline-md font-display">Level {user.level}</p>
              <p className="text-label mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                {user.xp} XP total tracked across {user._count.watchlist} series
              </p>
            </div>
          </div>

          <div className="flex-1 md:max-w-md md:ml-auto">
            <div className="flex items-center justify-between mb-1.5 gap-4">
              <span className="text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                {xpInLevel} / 100 XP TO LEVEL {user.level + 1}
              </span>
              <span className="text-label shrink-0" style={{ color: "var(--primary)", fontSize: 9 }}>
                {progressPct}% COMPLETE
              </span>
            </div>
            <div className="w-full overflow-hidden" style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2 }}>
              <div className="h-full" style={{ width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* XP history + Your characters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
        <div className="flex flex-col min-w-0">
          <SectionHeader title="XP HISTORY" href="/profile/xp" />
          {xpEvents.length === 0 ? (
            <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO ACTIVITY YET</p>
          ) : (
            <div className="flex flex-1 flex-col gap-2 min-h-0">
              {xpEvents.slice(0, 6).map((event: XpEvent) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4 }}
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

        <div className="flex flex-col min-w-0">
          <SectionHeader title="YOUR CHARACTERS" href="/profile/characters" />
          <div className="grid flex-1 min-h-0 grid-cols-3 grid-rows-2 gap-1.5">
            {previewCharacters.map((char, i) => {
              const isUnlocked = char ? user.xp >= char.xpRequired : false;
              return (
                <Link
                  key={char?.id ?? `locked-${i}`}
                  href={isUnlocked ? "/chat" : "/profile/characters"}
                  className="flex items-center justify-center overflow-hidden min-h-0"
                  style={{
                    background: isUnlocked ? "var(--bg-elevated)" : "var(--bg-card)",
                    border: `1px solid ${isUnlocked ? "var(--border-bright)" : "var(--border)"}`,
                    borderRadius: 4,
                    opacity: isUnlocked ? 1 : 0.45,
                  }}
                  aria-label={isUnlocked ? char!.name : "Locked character"}
                >
                  {isUnlocked && char ? (
                    <span style={{ fontSize: 28, filter: "grayscale(1)" }}>{char.avatarEmoji}</span>
                  ) : (
                    <Lock className="w-4 h-4" style={{ color: "var(--fg-subtle)" }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
