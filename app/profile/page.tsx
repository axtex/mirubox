import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
      _count: {
        select: {
          watchlist: true,
          ratings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) redirect("/auth/signin");

  const completedCount = await prisma.watchlistEntry.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  const avgRating = await prisma.rating.aggregate({
    where: { userId: user.id },
    _avg: { score: true },
  });

  const recentActivity = await prisma.watchlistEntry.findMany({
    where: { userId: user.id },
    include: { anime: { select: { id: true, title: true, coverImage: true, episodes: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const xpForCurrentLevel = (user.level - 1) * 100;
  const xpForNextLevel = user.level * 100;
  const xpProgress = user.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPct = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));

  const hoursEstimate = Math.round(completedCount * 5.5); // rough avg

  const joinYear = user.createdAt.getFullYear();

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={72}
            height={72}
            className="rounded-full"
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {(user.name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            {user.name ?? "Anime Fan"}
          </h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Member since {joinYear}
          </p>
        </div>
      </div>

      {/* XP / Level card */}
      <div className="card-base p-5 mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)" }}
            >
              {user.level}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                Level {user.level}
              </p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {user.xp} XP total
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
            {xpNeeded - xpProgress} XP to Lv.{user.level + 1}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: "var(--bg-card)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, var(--accent), var(--accent-bright))`,
            }}
          />
        </div>

        <p className="text-xs mt-2" style={{ color: "var(--fg-subtle)" }}>
          Earn XP by rating, reviewing, and tracking anime
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Tracked", value: user._count.watchlist },
          { label: "Completed", value: completedCount },
          { label: "Avg Rating", value: avgRating._avg.score ? avgRating._avg.score.toFixed(1) : "—" },
          { label: "Hours Est.", value: hoursEstimate > 0 ? `~${hoursEstimate}h` : "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="card-base p-4 flex flex-col gap-1"
            style={{ border: "1px solid var(--border)" }}
          >
            <span
              className="text-xl font-bold"
              style={{ color: "var(--fg)", fontFamily: "var(--font-mono)" }}
            >
              {value}
            </span>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-sm font-semibold mb-3"
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
                <div
                  className="relative shrink-0 rounded overflow-hidden"
                  style={{ width: 36, height: 50 }}
                >
                  {anime.coverImage ? (
                    <Image src={anime.coverImage} alt={anime.title} fill sizes="36px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                    {anime.title}
                  </p>
                  <span className="badge mt-1" style={{ fontSize: "10px" }}>
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Character unlock stub */}
      <section>
        <h2
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          Character Assistant
        </h2>
        <div
          className="card-base p-5 flex flex-col items-center gap-3 text-center"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--fg-subtle)",
                }}
              >
                🔒
              </div>
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
            Coming Soon — Week 2
          </p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Earn more XP to unlock AI character companions
          </p>
          <Link href="/watchlist" className="btn-ghost text-sm">
            Track more anime →
          </Link>
        </div>
      </section>
    </div>
  );
}
