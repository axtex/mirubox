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

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const [media, session] = await Promise.all([getMediaById(numId), auth()]);
  if (!media) notFound();

  const title = getDisplayTitle(media.title);

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

  const studios = media.studios?.nodes ?? [];
  const studio = studios[0]?.name ?? null;
  const metaRows = [
    { label: "FORMAT",   value: media.format?.replace(/_/g, " ") ?? null },
    { label: "STATUS",   value: media.status?.replace(/_/g, " ") ?? null },
    { label: "EPISODES", value: media.episodes?.toString() ?? null },
    { label: "CHAPTERS", value: media.chapters?.toString() ?? null },
    { label: "SEASON",   value: media.season ? `${media.season} ${media.seasonYear ?? ""}` : null },
    { label: "STUDIO",   value: studio },
  ].filter((r) => r.value);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 250 }}
      >
        <style>{`@media(min-width:768px){.detail-banner{height:400px!important}}`}</style>
        <div className="detail-banner absolute inset-0" style={{ height: 250 }}>
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
            <div className="absolute inset-0" style={{ background: "var(--bg-card)" }} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(15,15,18,0.1) 0%, rgba(15,15,18,0.5) 50%, rgba(15,15,18,1) 100%)",
            }}
          />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-10 -mt-12 relative z-10">

        {/* Desktop: two-column */}
        <div className="hidden md:flex gap-10 items-start">

          {/* Left 65% */}
          <div className="flex-1 min-w-0 pt-4">
            <h1 className="text-headline-lg font-display mb-1">{title}</h1>
            {media.title.native && title !== media.title.native && (
              <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>
                {media.title.native}
              </p>
            )}

            {/* Genre chips */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {media.genres.map((g) => (
                  <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className="genre-chip">
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-label" style={{ color: "var(--fg-muted)" }}>
              {media.format && <span>{media.format.replace(/_/g, " ")}</span>}
              {media.episodes && <span>{media.episodes} EPISODES</span>}
              {media.season && media.seasonYear && (
                <span>{media.season} {media.seasonYear}</span>
              )}
              {studio && <span>{studio.toUpperCase()}</span>}
            </div>

            {/* Synopsis */}
            {media.description && (
              <div className="mb-8">
                <p className="text-label mb-2" style={{ color: "var(--fg-subtle)" }}>SYNOPSIS</p>
                <DescriptionToggle description={media.description} />
              </div>
            )}

            {/* Characters */}
            {media.characters.edges.length > 0 && (
              <div className="mb-8">
                <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>CHARACTERS</p>
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                  {media.characters.edges.slice(0, 10).map(({ node }) => (
                    <div key={node.id} className="flex flex-col items-center gap-1.5">
                      <div className="relative overflow-hidden" style={{ width: 64, height: 64, borderRadius: 4 }}>
                        {node.image.medium ? (
                          <Image
                            src={node.image.medium}
                            alt={node.name.full ?? ""}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" style={{ background: "var(--bg-card)" }} />
                        )}
                      </div>
                      <p
                        className="text-[10px] text-center leading-tight line-clamp-2"
                        style={{ color: "var(--fg-muted)", fontFamily: "var(--font-space-mono)" }}
                      >
                        {node.name.full}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            {relatedAnime.length > 0 && (
              <div className="mb-10">
                <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>RELATED</p>
                <div className="flex scroll-row">
                  {relatedAnime.slice(0, 8).map(({ node, relationType }) => (
                    <div key={node.id} className="flex flex-col gap-1.5">
                      <AnimeCard
                        anime={{
                          ...node,
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
                      />
                      <span className="text-[9px] text-center" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-space-mono)" }}>
                        {relationType.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 35% — sticky sidebar */}
          <div className="w-72 shrink-0 flex flex-col gap-5 sticky top-[72px]">
            {/* Cover poster */}
            <div className="relative overflow-hidden w-full" style={{ aspectRatio: "2/3", borderRadius: 4 }}>
              {media.coverImage.extraLarge ? (
                <Image
                  src={media.coverImage.extraLarge}
                  alt={title}
                  fill
                  sizes="288px"
                  className="object-cover"
                />
              ) : null}
            </div>

            {/* Score */}
            {media.averageScore !== null && (
              <div
                className="text-2xl font-bold text-data"
                style={{ color: "var(--primary)", fontFamily: "var(--font-space-mono)" }}
              >
                ★ {media.averageScore}
              </div>
            )}

            {/* Watchlist */}
            <WatchlistButton
              animeId={numId}
              initialStatus={userWatchlistStatus}
              isLoggedIn={!!session}
            />

            {/* Rating */}
            <RatingInput
              animeId={numId}
              initialRating={userRating}
              isLoggedIn={!!session}
            />

            {/* Metadata card */}
            {metaRows.length > 0 && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {metaRows.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                  >
                    <span className="text-label" style={{ color: "var(--fg-subtle)" }}>{label}</span>
                    <span className="text-sm" style={{ color: "var(--fg)", fontFamily: "var(--font-geist)" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden">
          <div className="flex gap-4 mb-5">
            <div className="relative shrink-0 overflow-hidden shadow-2xl" style={{ width: 110, height: 165, borderRadius: 4 }}>
              {media.coverImage.extraLarge ? (
                <Image src={media.coverImage.extraLarge} alt={title} fill sizes="110px" className="object-cover" />
              ) : null}
            </div>
            <div className="flex flex-col gap-2 pt-6">
              {media.averageScore !== null && (
                <span className="text-xl font-bold" style={{ color: "var(--primary)", fontFamily: "var(--font-space-mono)" }}>
                  ★ {media.averageScore}
                </span>
              )}
              {media.format && <span className="badge">{media.format.replace(/_/g, " ")}</span>}
              {studio && <span className="text-label" style={{ color: "var(--fg-subtle)" }}>{studio.toUpperCase()}</span>}
            </div>
          </div>

          <h1 className="text-headline-lg font-display mb-1">{title}</h1>
          {media.title.native && title !== media.title.native && (
            <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>{media.title.native}</p>
          )}

          {media.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {media.genres.map((g) => (
                <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className="genre-chip">{g}</Link>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 mb-5">
            <WatchlistButton animeId={numId} initialStatus={userWatchlistStatus} isLoggedIn={!!session} />
            <RatingInput animeId={numId} initialRating={userRating} isLoggedIn={!!session} />
          </div>

          {media.description && (
            <div className="mb-5">
              <p className="text-label mb-2" style={{ color: "var(--fg-subtle)" }}>SYNOPSIS</p>
              <DescriptionToggle description={media.description} />
            </div>
          )}

          {metaRows.length > 0 && (
            <div className="mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
              {metaRows.map(({ label, value }, i) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <span className="text-label" style={{ color: "var(--fg-subtle)" }}>{label}</span>
                  <span className="text-sm" style={{ color: "var(--fg)" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {media.characters.edges.length > 0 && (
            <div className="mb-6">
              <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>CHARACTERS</p>
              <div className="grid grid-cols-3 gap-3">
                {media.characters.edges.slice(0, 6).map(({ node }) => (
                  <div key={node.id} className="flex flex-col items-center gap-1.5">
                    <div className="relative overflow-hidden" style={{ width: 56, height: 56, borderRadius: 4 }}>
                      {node.image.medium ? (
                        <Image src={node.image.medium} alt={node.name.full ?? ""} fill sizes="56px" className="object-cover" />
                      ) : <div className="w-full h-full" style={{ background: "var(--bg-card)" }} />}
                    </div>
                    <p className="text-[10px] text-center line-clamp-2 leading-tight"
                      style={{ color: "var(--fg-muted)", fontFamily: "var(--font-space-mono)" }}>
                      {node.name.full}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedAnime.length > 0 && (
            <div className="mb-10">
              <p className="text-label mb-3" style={{ color: "var(--fg-subtle)" }}>RELATED</p>
              <div className="flex scroll-row">
                {relatedAnime.slice(0, 8).map(({ node, relationType }) => (
                  <div key={node.id} className="flex flex-col gap-1">
                    <AnimeCard
                      anime={{ ...node, bannerImage: null, genres: [], episodes: null, chapters: null, season: null, seasonYear: null, averageScore: null, popularity: null }}
                      size="sm"
                    />
                    <span className="text-[9px] text-center" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-space-mono)" }}>
                      {relationType.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
