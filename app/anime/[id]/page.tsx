import { Fragment } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getMediaById, getDisplayTitle } from "@/lib/anilist";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WatchlistButton } from "@/components/anime/detail/WatchlistButton";
import { DescriptionToggle } from "@/components/anime/detail/DescriptionToggle";
import { TrackerStatusBar } from "@/components/anime/detail/TrackerStatusBar";
import { ReviewInput } from "@/components/anime/detail/ReviewInput";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

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
    description: media.description?.replace(/<[^>]*>/g, "").slice(0, 160) ?? undefined,
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
  if (score >= 75) return "high";
  if (score >= 60) return "mid";
  return "low";
}

const VALID_RELATION_TYPES = new Set([
  "SEQUEL",
  "PREQUEL",
  "ALTERNATIVE_VERSION",
  "ADAPTATION",
  "PARENT",
]);

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const [media, session] = await Promise.all([getMediaById(numId), auth()]);
  if (!media) notFound();

  const title = getDisplayTitle(media.title);
  const nativeTitle =
    media.title.native && media.title.native !== title ? media.title.native : null;

  let userWatchlistStatus: string | null = null;
  let userRating: number | null = null;
  let userReview: { content: string; containsSpoilers: boolean } | null = null;

  if (session?.user?.id) {
    const [entry, rating, review] = await Promise.all([
      prisma.watchlistEntry
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { status: true },
        })
        .catch(() => null),
      prisma.rating
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { score: true },
        })
        .catch(() => null),
      prisma.review
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { content: true, containsSpoilers: true },
        })
        .catch(() => null),
    ]);
    userWatchlistStatus = entry?.status ?? null;
    userRating = rating?.score ?? null;
    userReview = review;
  }

  const studio = media.studios?.nodes[0]?.name ?? null;

  const metaChips = [
    media.format?.replace(/_/g, " "),
    media.episodes ? `${media.episodes} EPS` : null,
    media.status?.replace(/_/g, " "),
    media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : null,
    studio,
  ].filter((v): v is string => !!v);

  const filteredRelations = media.relations.edges.filter((e) =>
    VALID_RELATION_TYPES.has(e.relationType)
  );

  const streamingLinks = media.externalLinks.filter(
    (l) => l.type === "STREAMING"
  );

  const recs = media.recommendations.nodes
    .map((n) => n.mediaRecommendation)
    .filter((m): m is AnimeCardType => m !== null)
    .slice(0, 6);

  const daysUntilAiring = media.nextAiringEpisode
    ? Math.max(
        0,
        Math.ceil(
          (media.nextAiringEpisode.airingAt - Date.now() / 1000) / 86400
        )
      )
    : null;

  const anilistUrl = `https://anilist.co/anime/${numId}`;

  const PosterImage = (
    <>
      {media.coverImage.extraLarge ? (
        <Image
          src={media.coverImage.extraLarge}
          alt={title}
          fill
          sizes="160px"
          className="object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: "var(--bg-card)" }}
        >
          <span
            style={{
              fontSize: 48,
              color: "var(--fg-subtle)",
              fontFamily: "var(--font-anybody)",
              fontWeight: 700,
            }}
          >
            {title[0]}
          </span>
        </div>
      )}
    </>
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <div className="relative">

        {/* BANNER */}
        <div className="relative w-full overflow-hidden detail-banner-h">
          {media.bannerImage ? (
            <Image
              src={media.bannerImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--bg-card)" }} />
          )}
          {/* bottom-60% fade to bg */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,15,18,0) 0%, rgba(15,15,18,0.65) 50%, rgba(15,15,18,1) 100%)",
            }}
          />
          {/* left-40% text legibility gradient */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, rgba(15,15,18,0.65) 0%, transparent 42%)",
            }}
          />
        </div>

        {/* POSTER — desktop: absolute overlapping right of banner */}
        <div
          className="hidden md:block absolute overflow-hidden"
          style={{
            width: 160,
            height: 240,
            top: 160,
            right:
              "max(calc((100vw - var(--page-max-width)) / 2 + var(--page-padding-x)), var(--page-padding-x))",
            borderRadius: 2,
            border: "2px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            zIndex: 20,
          }}
        >
          {PosterImage}
        </div>

        {/* HERO CONTENT */}
        <div className="page-container">

          {/* ── Mobile ───────────────────────────────────────────────── */}
          <div className="md:hidden flex flex-col items-center text-center">
            {/* Poster — centered, pulled up over banner */}
            <div
              className="relative overflow-hidden mx-auto"
              style={{
                width: 100,
                height: 150,
                marginTop: -60,
                marginBottom: 20,
                borderRadius: 2,
                border: "2px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {media.coverImage.extraLarge ? (
                <Image
                  src={media.coverImage.extraLarge}
                  alt={title}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "var(--bg-card)" }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      color: "var(--fg-subtle)",
                      fontFamily: "var(--font-anybody)",
                      fontWeight: 700,
                    }}
                  >
                    {title[0]}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-headline-lg font-display mb-1">{title}</h1>
            {nativeTitle && (
              <p
                className="mb-3"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  letterSpacing: "0.05em",
                }}
              >
                {nativeTitle}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mb-3">
              {metaChips.map((chip, i) => (
                <Fragment key={chip + i}>
                  {i > 0 && (
                    <span style={{ color: "var(--fg-subtle)", lineHeight: 1 }}>·</span>
                  )}
                  <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
                    {chip}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Genre chips */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {media.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="genre-chip"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Score */}
            {media.averageScore !== null && (
              <div className="flex flex-col items-center mb-4">
                <span
                  className={`score-badge ${scoreClass(media.averageScore)}`}
                  style={{ fontSize: "1.1rem", padding: "4px 12px" }}
                >
                  ★ {media.averageScore}
                </span>
                <span
                  className="mt-1.5"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--fg-muted)",
                  }}
                >
                  MEAN SCORE
                </span>
              </div>
            )}

            {/* CTA buttons */}
            <div className="w-full flex flex-col gap-2 mb-6">
              <WatchlistButton
                animeId={numId}
                initialStatus={userWatchlistStatus}
                isLoggedIn={!!session}
              />
              <a
                href={anilistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full justify-center gap-1.5"
              >
                <ExternalLink size={12} />
                ANILIST
              </a>
            </div>
          </div>

          {/* ── Desktop ──────────────────────────────────────────────── */}
          <div
            className="hidden md:block"
            style={{ paddingTop: 32, paddingRight: "calc(160px + 2.5rem)", minHeight: 80 }}
          >
            <h1 className="text-headline-lg font-display mb-1">{title}</h1>
            {nativeTitle && (
              <p
                className="mb-4"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  letterSpacing: "0.05em",
                }}
              >
                {nativeTitle}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
              {metaChips.map((chip, i) => (
                <Fragment key={chip + i}>
                  {i > 0 && (
                    <span style={{ color: "var(--fg-subtle)" }}>·</span>
                  )}
                  <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
                    {chip}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Genre chips */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {media.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="genre-chip"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Score + Actions */}
            <div className="flex items-end gap-6 flex-wrap mb-8">
              {media.averageScore !== null && (
                <div className="flex flex-col">
                  <span
                    className={`score-badge ${scoreClass(media.averageScore)}`}
                    style={{ fontSize: "1.5rem", padding: "6px 14px", alignSelf: "flex-start" }}
                  >
                    ★ {media.averageScore}
                  </span>
                  <span
                    className="mt-1.5"
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--fg-muted)",
                    }}
                  >
                    MEAN SCORE
                  </span>
                </div>
              )}
              <WatchlistButton
                animeId={numId}
                initialStatus={userWatchlistStatus}
                isLoggedIn={!!session}
              />
              <a
                href={anilistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 self-center"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-subtle)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
              >
                <ExternalLink size={12} />
                ANILIST
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTIONS ═══════════════════════════════════════════════════════ */}
      <div className="page-container">
        <div className="flex flex-col gap-8 py-8">

          {/* TRACKER STATUS — shown only when user is tracking */}
          {userWatchlistStatus && (
            <TrackerStatusBar
              animeId={numId}
              initialStatus={userWatchlistStatus}
              initialRating={userRating}
              mediaType="ANIME"
            />
          )}

          {session?.user && (
            <ReviewInput
              animeId={numId}
              initialReview={userReview}
              isLoggedIn
            />
          )}

          {/* SYNOPSIS */}
          {media.description && (
            <section>
              <p className="text-label mb-3" style={{ color: "var(--fg-muted)" }}>
                SYNOPSIS
              </p>
              <DescriptionToggle description={media.description} />
            </section>
          )}

          {/* WHERE TO WATCH */}
          <section>
            <p className="text-label mb-3" style={{ color: "var(--fg-muted)" }}>
              WHERE TO WATCH
            </p>
            {streamingLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {streamingLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ext-chip"
                  >
                    {link.site}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            ) : (
              <p
                className="text-label"
                style={{ color: "var(--fg-subtle)" }}
              >
                No official streaming links available
              </p>
            )}
          </section>

          {/* EPISODES */}
          {(media.episodes || media.nextAiringEpisode) && (
            <section>
              <p className="text-label mb-3" style={{ color: "var(--fg-muted)" }}>
                EPISODES
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {media.episodes && (
                  <span
                    style={{
                      fontFamily: "var(--font-anybody)",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--fg)",
                    }}
                  >
                    {media.episodes} episodes
                  </span>
                )}
                {media.nextAiringEpisode && daysUntilAiring !== null && (
                  <span
                    className="text-label"
                    style={{
                      background: "var(--primary-dim)",
                      border: "1px solid var(--primary)",
                      borderRadius: 2,
                      padding: "4px 10px",
                      color: "var(--primary)",
                    }}
                  >
                    EP {media.nextAiringEpisode.episode} AIRS IN{" "}
                    {daysUntilAiring === 0
                      ? "TODAY"
                      : `${daysUntilAiring} ${daysUntilAiring === 1 ? "DAY" : "DAYS"}`}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* CHARACTERS */}
          {media.characters.edges.length > 0 && (
            <section>
              <p className="text-label mb-4" style={{ color: "var(--fg-muted)" }}>
                CHARACTERS
              </p>
              {/* Mobile: 4 */}
              <div className="md:hidden flex scroll-row">
                {media.characters.edges.slice(0, 4).map(({ node, role }) => (
                  <div
                    key={node.id}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    style={{ width: 72 }}
                  >
                    <div
                      className="relative overflow-hidden w-full"
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: 2,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {node.image.medium ? (
                        <Image
                          src={node.image.medium}
                          alt={node.name.full ?? ""}
                          fill
                          sizes="72px"
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
                      className="text-[10px] text-center leading-tight line-clamp-2"
                      style={{
                        color: "var(--fg-muted)",
                        fontFamily: "var(--font-space-mono)",
                      }}
                    >
                      {node.name.full}
                    </p>
                    <span
                      className="text-[9px]"
                      style={{
                        color: "var(--fg-subtle)",
                        fontFamily: "var(--font-space-mono)",
                      }}
                    >
                      {role}
                    </span>
                  </div>
                ))}
              </div>
              {/* Desktop: 8 */}
              <div className="hidden md:flex scroll-row">
                {media.characters.edges.slice(0, 8).map(({ node, role }) => (
                  <div
                    key={node.id}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    style={{ width: 80 }}
                  >
                    <div
                      className="relative overflow-hidden w-full"
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: 2,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {node.image.medium ? (
                        <Image
                          src={node.image.medium}
                          alt={node.name.full ?? ""}
                          fill
                          sizes="80px"
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
                      className="text-[10px] text-center leading-tight line-clamp-2"
                      style={{
                        color: "var(--fg-muted)",
                        fontFamily: "var(--font-space-mono)",
                      }}
                    >
                      {node.name.full}
                    </p>
                    <span
                      className="text-[9px]"
                      style={{
                        color: "var(--fg-subtle)",
                        fontFamily: "var(--font-space-mono)",
                      }}
                    >
                      {role}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RELATIONS */}
          {filteredRelations.length > 0 && (
            <section>
              <p className="text-label mb-4" style={{ color: "var(--fg-muted)" }}>
                RELATED
              </p>
              <div className="flex scroll-row">
                {filteredRelations.slice(0, 8).map(({ node, relationType }) => (
                  <div
                    key={node.id}
                    className="flex flex-col gap-1.5 shrink-0"
                    style={{ width: 100 }}
                  >
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
                    <span
                      className="text-center"
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        color: "var(--fg-subtle)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {relationType.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RECOMMENDATIONS */}
          {recs.length > 0 && (
            <section>
              <p className="text-label mb-4" style={{ color: "var(--fg-muted)" }}>
                YOU MIGHT ALSO LIKE
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {recs.map((rec) => (
                  <AnimeCard key={rec.id} anime={rec} size="md" />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
