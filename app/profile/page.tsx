import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  const [completedCount, avgRating, recentActivity, xpEvents, watchlistWithGenres] =
    await Promise.all([
      prisma.watchlistEntry.count({ where: { userId: user.id, status: "COMPLETED" } }),
      prisma.rating.aggregate({ where: { userId: user.id }, _avg: { score: true } }),
      prisma.watchlistEntry.findMany({
        where: { userId: user.id },
        include: { anime: { select: { id: true, title: true, coverImage: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.xpEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.watchlistEntry.findMany({
        where: { userId: user.id },
        include: { anime: { select: { genres: true } } },
      }),
    ]);

  // Top genres from watchlist
  const genreCounts: Record<string, number> = {};
  for (const entry of watchlistWithGenres) {
    for (const g of entry.anime.genres) {
      genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const watchingCount = await prisma.watchlistEntry.count({
    where: { userId: user.id, status: "WATCHING" },
  });

  const xpInLevel = user.xp % 100;
  const progressPct = Math.min(100, xpInLevel);
  const xpNeeded = 100 - xpInLevel;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {user.image ? (
          <Image src={user.image} alt={user.name ?? "User"} width={72} height={72} className="rounded-full" />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {(user.name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}>
            {user.name ?? "Anime Fan"}
          </h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Member since {user.createdAt.getFullYear()}
          </p>
        </div>
      </div>

      {/* XP / Level card */}
      <div className="card-base p-5 mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl"
              style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)" }}
            >
              {user.level}
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--fg)" }}>Level {user.level}</p>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                {user.xp} XP total
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
            {xpNeeded} XP to Lv.{user.level + 1}
          </p>
        </div>

        <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: "var(--bg-card)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-bright))",
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--fg-subtle)" }}>
          {xpInLevel} / 100 XP to Level {user.level + 1}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Tracked", value: user._count.watchlist },
          { label: "Completed", value: completedCount },
          { label: "Watching", value: watchingCount },
          { label: "Avg Rating", value: avgRating._avg.score ? avgRating._avg.score.toFixed(1) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="card-base p-4 flex flex-col gap-1" style={{ border: "1px solid var(--border)" }}>
            <span className="text-xl font-bold" style={{ color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
              {value}
            </span>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Top genres */}
      {topGenres.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Top Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="badge"
                style={{ fontSize: "12px", padding: "4px 10px" }}
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* XP History */}
      {xpEvents.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-xs font-semibold mb-3"
            style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            XP History
          </h2>
          <div className="flex flex-col gap-1.5">
            {xpEvents.map((event: XpEvent) => (
              <div
                key={event.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  {event.reason}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--accent-bright)", fontFamily: "var(--font-mono)" }}
                  >
                    +{event.amount} XP
                  </span>
                  <span className="text-xs" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                    {timeAgo(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Character roster */}
      <section className="mb-8">
        <h2
          className="text-xs font-semibold mb-3"
          style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          Your Characters
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHARACTER_ROSTER.map((char) => {
            const isUnlocked = user.xp >= char.xpRequired;
            return (
              <div
                key={char.id}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-center"
                style={{
                  background: isUnlocked ? `${char.accentColor}11` : "var(--bg-card)",
                  border: `1px solid ${isUnlocked ? char.accentColor + "55" : "var(--border)"}`,
                  opacity: isUnlocked ? 1 : 0.6,
                }}
              >
                <span className="text-3xl">{isUnlocked ? char.avatarEmoji : "🔒"}</span>
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: isUnlocked ? "var(--fg)" : "var(--fg-subtle)" }}
                  >
                    {char.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>{char.anime}</p>
                </div>
                {isUnlocked ? (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: char.accentColor, color: "#fff" }}
                  >
                    Unlocked
                  </span>
                ) : (
                  <p className="text-[10px]" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    Unlock at {char.xpRequired} XP
                  </p>
                )}
                {!isUnlocked && (
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "var(--bg)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((user.xp / char.xpRequired) * 100))}%`,
                        background: char.accentColor,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-xs font-semibold mb-3"
            style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Recent Activity
          </h2>
          <div className="flex flex-col gap-2">
            {recentActivity.map(({ anime, status }) => (
              <Link
                key={anime.id}
                href={`/anime/${anime.id}`}
                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
              >
                <div className="relative shrink-0 rounded overflow-hidden" style={{ width: 36, height: 50 }}>
                  {anime.coverImage ? (
                    <Image src={anime.coverImage} alt={anime.title} fill sizes="36px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{anime.title}</p>
                  <span className="badge mt-1" style={{ fontSize: "10px" }}>
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
