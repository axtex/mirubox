import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getMediaById, getDisplayTitle } from "@/lib/anilist";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WatchlistButton } from "@/components/anime/detail/WatchlistButton";
import { RatingInput } from "@/components/anime/detail/RatingInput";
import { DescriptionToggle } from "@/components/anime/detail/DescriptionToggle";
import { AnimeCard } from "@/components/anime/AnimeCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const media = await getMediaById(Number(id));
  if (!media) return { title: "Not Found — mirubox" };
  const title = getDisplayTitle(media.title);
  return {
    title: `${title} — mirubox`,
    description: media.description?.slice(0, 160) ?? undefined,
    openGraph: {
      images: media.bannerImage
        ? [media.bannerImage]
        : media.coverImage.extraLarge
          ? [media.coverImage.extraLarge]
          : [],
    },
  };
}

function scoreClass(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const [media, session] = await Promise.all([
    getMediaById(numId),
    auth(),
  ]);

  if (!media) notFound();

  const title = getDisplayTitle(media.title);

  // Load user's watchlist / rating if logged in
  let userWatchlistStatus: string | null = null;
  let userRating: number | null = null;

  if (session?.user?.id) {
    const [entry, rating] = await Promise.all([
      prisma.watchlistEntry.findUnique({
        where: { userId_animeId: { userId: session.user.id, animeId: numId } },
        select: { status: true },
      }).catch(() => null),
      prisma.rating.findUnique({
        where: { userId_animeId: { userId: session.user.id, animeId: numId } },
        select: { score: true },
      }).catch(() => null),
    ]);
    userWatchlistStatus = entry?.status ?? null;
    userRating = rating?.score ?? null;
  }

  const relatedAnime = media.relations.edges.filter(
    (e) => e.node.type === "ANIME" || e.node.type === "MANGA"
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ── Banner ───────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "300px", maxHeight: "400px" }}>
        {media.bannerImage || media.coverImage.extraLarge ? (
          <Image
            src={(media.bannerImage ?? media.coverImage.extraLarge)!}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-card)" }} />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 30%, var(--bg) 100%)",
          }}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-10 -mt-16 relative z-10">
        {/* Mobile: stacked layout */}
        <div className="md:hidden">
          {/* Cover */}
          <div className="flex gap-4 mb-6">
            <div
              className="relative shrink-0 rounded-lg overflow-hidden shadow-2xl"
              style={{ width: 120, height: 170 }}
            >
              {media.coverImage.extraLarge ? (
                <Image
                  src={media.coverImage.extraLarge}
                  alt={title}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-2 pt-8">
              {media.averageScore !== null && (
                <span
                  className={`score-badge ${scoreClass(media.averageScore)} self-start text-base`}
                  style={{ fontSize: "1.25rem", padding: "4px 10px" }}
                >
                  ★ {media.averageScore}
                </span>
              )}
              {media.format && <span className="badge">{media.format.replace(/_/g, " ")}</span>}
              {media.status && (
                <span
                  className="text-xs"
                  style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
                >
                  {media.status.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            {title}
          </h1>
          {media.title.native && title !== media.title.native && (
            <p className="text-sm mb-4" style={{ color: "var(--fg-subtle)" }}>
              {media.title.native}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mb-6">
            <WatchlistButton
              animeId={numId}
              initialStatus={userWatchlistStatus}
              isLoggedIn={!!session}
            />
            <RatingInput
              animeId={numId}
              initialRating={userRating}
              isLoggedIn={!!session}
            />
          </div>

          {/* Genres */}
          {media.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {media.genres.map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="badge transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {/* Metadata grid */}
          <MetadataGrid media={media} />

          {/* Description */}
          {media.description && (
            <div className="mb-6">
              <h2
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Synopsis
              </h2>
              <DescriptionToggle description={media.description} />
            </div>
          )}
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden md:flex gap-8">
          {/* Left: 70% */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-4xl font-bold mb-1 mt-8"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              {title}
            </h1>
            {media.title.native && title !== media.title.native && (
              <p className="text-base mb-5" style={{ color: "var(--fg-subtle)" }}>
                {media.title.native}
              </p>
            )}

            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {media.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="badge transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {media.description && (
              <div className="mb-6">
                <h2
                  className="text-xs font-semibold mb-2"
                  style={{ color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  Synopsis
                </h2>
                <DescriptionToggle description={media.description} />
              </div>
            )}
          </div>

          {/* Right: 30% */}
          <div className="w-72 shrink-0 flex flex-col gap-5 pt-4">
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl self-start"
              style={{ width: 200, height: 285 }}
            >
              {media.coverImage.extraLarge ? (
                <Image
                  src={media.coverImage.extraLarge}
                  alt={title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : null}
            </div>

            {media.averageScore !== null && (
              <span
                className={`score-badge ${scoreClass(media.averageScore)} self-start text-lg`}
                style={{ fontSize: "1.5rem", padding: "6px 14px" }}
              >
                ★ {media.averageScore}
              </span>
            )}

            <WatchlistButton
              animeId={numId}
              initialStatus={userWatchlistStatus}
              isLoggedIn={!!session}
            />
            <RatingInput
              animeId={numId}
              initialRating={userRating}
              isLoggedIn={!!session}
            />

            <MetadataGrid media={media} compact />
          </div>
        </div>

        {/* ── Characters ───────────────────────────────────────────── */}
        {media.characters.edges.length > 0 && (
          <section className="mt-8 mb-8">
            <h2
              className="text-base font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              Characters
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {media.characters.edges.map(({ node, role }) => (
                <div key={node.id} className="flex flex-col items-center gap-1">
                  <div
                    className="relative rounded-full overflow-hidden"
                    style={{ width: 64, height: 64 }}
                  >
                    {node.image.medium ? (
                      <Image
                        src={node.image.medium}
                        alt={node.name.full ?? ""}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: "var(--bg-card)" }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs text-center leading-tight line-clamp-2"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {node.name.full}
                  </p>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
                  >
                    {role}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Related ──────────────────────────────────────────────── */}
        {relatedAnime.length > 0 && (
          <section className="mb-10">
            <h2
              className="text-base font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              Related
            </h2>
            <div className="scroll-row md:flex md:flex-wrap md:gap-4">
              {relatedAnime.slice(0, 8).map(({ node, relationType }) => (
                <div key={node.id} className="flex flex-col gap-1" style={{ width: 120 }}>
                  <AnimeCard
                    anime={{
                      ...node,
                      title: node.title,
                      coverImage: node.coverImage,
                      bannerImage: null,
                      genres: [],
                      episodes: null,
                      chapters: null,
                      season: null,
                      seasonYear: null,
                      averageScore: null,
                      popularity: null,
                    }}
                    size="sm"
                    showScore={false}
                  />
                  <span
                    className="text-[10px] text-center"
                    style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
                  >
                    {relationType.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MetadataGrid({
  media,
  compact = false,
}: {
  media: Awaited<ReturnType<typeof getMediaById>>;
  compact?: boolean;
}) {
  if (!media) return null;
  const studios = media.studios?.nodes ?? [];

  const rows = [
    { label: "Format", value: media.format?.replace(/_/g, " ") ?? null },
    { label: "Status", value: media.status?.replace(/_/g, " ") ?? null },
    { label: "Episodes", value: media.episodes?.toString() ?? null },
    { label: "Chapters", value: media.chapters?.toString() ?? null },
    { label: "Season", value: media.season ? `${media.season[0] + media.season.slice(1).toLowerCase()} ${media.seasonYear ?? ""}` : null },
    { label: "Studio", value: studios[0]?.name ?? null },
    { label: "Popularity", value: media.popularity ? `#${media.popularity.toLocaleString()}` : null },
  ].filter((r) => r.value);

  return (
    <div
      className={`grid gap-x-4 gap-y-2 mb-6 ${compact ? "grid-cols-1" : "grid-cols-2"}`}
    >
      {rows.map(({ label, value }) => (
        <div key={label}>
          <span
            className="text-[10px] font-semibold block"
            style={{ color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            {label}
          </span>
          <span className="text-sm" style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
