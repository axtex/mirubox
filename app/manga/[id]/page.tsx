import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getMediaById, getDisplayTitle } from "@/lib/anilist";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DescriptionToggle } from "@/components/anime/detail/DescriptionToggle";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AddToListButton } from "@/components/lists/AddToListModal";
import { HeroArchiveButton } from "@/components/detail/HeroArchiveButton";
import { DetailTrackerBar } from "@/components/detail/DetailTrackerBar";
import { DetailSidebar } from "@/components/detail/DetailSidebar";
import { MangaCharacterSection } from "@/components/detail/MangaCharacterSection";
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
  "SEQUEL", "PREQUEL", "ALTERNATIVE_VERSION", "ADAPTATION", "PARENT",
]);

const MANGA_READING_SITES = new Set([
  "MangaPlus", "Viz", "Comikey", "Tapas", "ComicWalker",
  "K Manga", "Official Site",
]);

export default async function MangaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const [media, session] = await Promise.all([getMediaById(numId), auth()]);
  if (!media) notFound();

  const title = getDisplayTitle(media.title);
  const nativeTitle =
    media.title.native && media.title.native !== title ? media.title.native : null;

  let userWatchlistStatus: string | null = null;
  let userProgress = 0;
  let userRating: number | null = null;

  if (session?.user?.id) {
    const [entry, rating] = await Promise.all([
      prisma.watchlistEntry
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { status: true, progress: true },
        })
        .catch(() => null),
      prisma.rating
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { score: true },
        })
        .catch(() => null),
    ]);
    userWatchlistStatus = entry?.status ?? null;
    userProgress = entry?.progress ?? 0;
    userRating = rating?.score ?? null;
  }

  // For manga, author comes from studios (AniList uses staff for this, but studios is what we have)
  const author = media.studios?.nodes[0]?.name ?? null;

  const metaChips = [
    media.format?.replace(/_/g, " "),
    media.chapters ? `${media.chapters} CH` : null,
    media.volumes ? `${media.volumes} VOL` : null,
    media.status?.replace(/_/g, " "),
    author,
  ].filter((v): v is string => !!v);

  const filteredRelations = media.relations.edges.filter((e) =>
    VALID_RELATION_TYPES.has(e.relationType)
  );

  const readingLinks = media.externalLinks.filter((l) => MANGA_READING_SITES.has(l.site));

  const recs = media.recommendations.nodes
    .map((n) => n.mediaRecommendation)
    .filter((m): m is AnimeCardType => m !== null)
    .slice(0, 6);

  // Characters — MAIN first
  const sortedChars = [...media.characters.edges].sort((a, b) => {
    if (a.role === "MAIN" && b.role !== "MAIN") return -1;
    if (a.role !== "MAIN" && b.role === "MAIN") return 1;
    return 0;
  });

  const sidebarDetails = [
    { label: "FORMAT",   value: media.format?.replace(/_/g, " ") },
    { label: "CHAPTERS", value: media.chapters ? String(media.chapters) : null },
    { label: "VOLUMES",  value: media.volumes ? String(media.volumes) : null },
    { label: "STATUS",   value: media.status?.replace(/_/g, " ") },
    { label: "AUTHOR",   value: author },
    { label: "SOURCE",   value: media.source?.replace(/_/g, " ") },
    { label: "SCORE",    value: media.meanScore ? String(media.meanScore) : null },
  ];

  const showGenresInSidebar = media.genres.length > 5;
  const heroGenres = showGenresInSidebar ? media.genres.slice(0, 4) : media.genres;

  const SECTION_TITLE: CSSProperties = {
    fontFamily: "var(--font-space-mono)",
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#5a5a65",
    marginBottom: 6,
  };

  const SIDEBAR = (
    <DetailSidebar
      mediaId={numId}
      mediaType="MANGA"
      details={sidebarDetails}
      genres={media.genres}
      genreSearchPrefix="/search?type=MANGA&genre="
      initialProgress={userProgress}
      initialTotal={media.chapters ?? null}
      initialRating={userRating}
    />
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
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #1a1a2e, #131316)" }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #0f0f12 0%, transparent 60%)" }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{ background: "linear-gradient(to right, rgba(15,15,18,0.75) 0%, transparent 55%)" }}
          />
        </div>

        {/* POSTER — desktop: absolute, overlapping right of banner */}
        <div
          className="hidden md:block absolute overflow-hidden"
          style={{
            width: 160, height: 240,
            top: 128,
            right: "max(calc((100vw - var(--page-max-width)) / 2 + var(--page-padding-x)), var(--page-padding-x))",
            borderRadius: 2,
            border: "2px solid #2a2a2d",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            zIndex: 20,
          }}
        >
          {media.coverImage.extraLarge ? (
            <Image src={media.coverImage.extraLarge} alt={title} fill sizes="160px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#1b1b1e" }}>
              <span style={{ fontSize: 24, color: "#5a5a65", fontFamily: "var(--font-space-mono)" }}>{title[0]}</span>
            </div>
          )}
        </div>

        {/* HERO CONTENT */}
        <div className="page-container">

          {/* ── Mobile ───────────────────────────────────────────────── */}
          <div className="md:hidden flex flex-col items-center text-center">
            <div
              className="relative overflow-hidden mx-auto"
              style={{
                width: 100, height: 150,
                marginTop: -50, marginBottom: 12,
                borderRadius: 2, border: "2px solid #2a2a2d",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {media.coverImage.extraLarge ? (
                <Image src={media.coverImage.extraLarge} alt={title} fill sizes="100px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#1b1b1e" }}>
                  <span style={{ fontSize: 20, color: "#5a5a65", fontFamily: "var(--font-space-mono)" }}>{title[0]}</span>
                </div>
              )}
            </div>

            <h1 style={{ fontFamily: "var(--font-anybody)", fontWeight: 600, fontSize: 18, lineHeight: 1.2, color: "#e4e1e6", marginBottom: 4 }}>
              {title}
            </h1>
            {nativeTitle && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65", marginBottom: 8 }}>
                {nativeTitle}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-1.5 mb-3">
              {metaChips.map((chip) => (
                <span key={chip} style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#9e9ea8", background: "#1b1b1e", border: "1px solid #2a2a2d", borderRadius: 2, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {chip}
                </span>
              ))}
            </div>

            {heroGenres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {heroGenres.map((g) => (
                  <Link key={g} href={`/search?type=MANGA&genre=${encodeURIComponent(g)}`} className="genre-chip">{g}</Link>
                ))}
                {showGenresInSidebar && (
                  <a href="#sidebar-genres" className="genre-chip">+{media.genres.length - 4} MORE →</a>
                )}
              </div>
            )}

            {media.averageScore !== null && (
              <div className="flex flex-col items-center mb-4">
                <span className={`score-badge ${scoreClass(media.averageScore)}`} style={{ fontSize: "1.1rem", padding: "4px 12px" }}>
                  ★ {media.averageScore}
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5a65", marginTop: 4 }}>
                  MEAN SCORE
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 mb-6">
              <HeroArchiveButton mediaId={numId} mediaType="MANGA" />
              <AddToListButton mediaId={numId} mediaType="MANGA" isLoggedIn={!!session} />
            </div>
          </div>

          {/* ── Desktop ──────────────────────────────────────────────── */}
          <div className="hidden md:block" style={{ paddingTop: 32, paddingRight: "calc(160px + 2.5rem)", minHeight: 80 }}>
            <h1 style={{ fontFamily: "var(--font-anybody)", fontWeight: 600, fontSize: 22, lineHeight: 1.2, color: "#e4e1e6", marginBottom: 4 }}>
              {title}
            </h1>
            {nativeTitle && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65", marginBottom: 8 }}>
                {nativeTitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {metaChips.map((chip) => (
                <span key={chip} style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#9e9ea8", background: "#1b1b1e", border: "1px solid #2a2a2d", borderRadius: 2, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {chip}
                </span>
              ))}
            </div>

            {heroGenres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {heroGenres.map((g) => (
                  <Link key={g} href={`/search?type=MANGA&genre=${encodeURIComponent(g)}`} className="genre-chip">{g}</Link>
                ))}
                {showGenresInSidebar && (
                  <a href="#sidebar-genres" className="genre-chip">+{media.genres.length - 4} MORE →</a>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap mb-8">
              {media.averageScore !== null && (
                <div className="flex flex-col">
                  <span className={`score-badge ${scoreClass(media.averageScore)}`} style={{ fontSize: "1.5rem", padding: "6px 14px", alignSelf: "flex-start" }}>
                    ★ {media.averageScore}
                  </span>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5a65", marginTop: 4 }}>
                    MEAN SCORE
                  </span>
                </div>
              )}
              <HeroArchiveButton mediaId={numId} mediaType="MANGA" />
              <AddToListButton mediaId={numId} mediaType="MANGA" isLoggedIn={!!session} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT ═════════════════════════════════════════════════════ */}
      <div className="page-container">
        <div className="flex gap-7 py-8" style={{ alignItems: "flex-start" }}>

          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-5 min-w-0" style={{ flex: 1 }}>

            {/* 1. TRACKER STATUS BAR */}
            {session?.user && userWatchlistStatus && (
              <DetailTrackerBar
                mediaId={numId}
                mediaType="MANGA"
                initialStatus={userWatchlistStatus}
                initialProgress={userProgress}
                initialTotal={media.chapters ?? null}
                initialRating={userRating}
              />
            )}

            {/* 2. SYNOPSIS */}
            {media.description && (
              <section>
                <p style={SECTION_TITLE}>SYNOPSIS</p>
                <DescriptionToggle description={media.description} />
              </section>
            )}

            {/* 3. WHERE TO READ */}
            <section>
              <p style={SECTION_TITLE}>WHERE TO READ</p>
              {readingLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {readingLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ext-chip"
                    >
                      {link.site} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#5a5a65" }}>
                  No official reading links found.
                </p>
              )}
            </section>

            {/* 4. CHARACTERS (manga — no VAs) */}
            {sortedChars.length > 0 && (
              <MangaCharacterSection chars={sortedChars} />
            )}

            {/* 5. RELATIONS */}
            {filteredRelations.length > 0 && (
              <section>
                <p style={SECTION_TITLE}>RELATIONS</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {filteredRelations.map(({ node, relationType }) => (
                    <Link
                      key={node.id}
                      href={`/${node.type === "MANGA" ? "manga" : "anime"}/${node.id}`}
                      className="flex flex-col gap-1 shrink-0 no-underline"
                      style={{ width: 80 }}
                    >
                      <div className="relative overflow-hidden" style={{ height: 112, borderRadius: 2, border: "1px solid #1f1f22" }}>
                        {node.coverImage.large ? (
                          <Image src={node.coverImage.large} alt={getDisplayTitle(node.title)} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: "#1b1b1e" }} />
                        )}
                      </div>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#5a5a65", textTransform: "uppercase" }}>
                        {relationType.replace(/_/g, " ")}
                      </span>
                      <span className="truncate" style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#9e9ea8" }}>
                        {getDisplayTitle(node.title)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 6. RECOMMENDATIONS */}
            {recs.length > 0 && (
              <section>
                <p style={SECTION_TITLE}>YOU MIGHT ALSO LIKE</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {recs.map((rec) => (
                    <AnimeCard key={rec.id} anime={rec} size="md" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR — desktop only (sticky) */}
          <div className="hidden md:block" style={{ width: 220, flexShrink: 0, position: "sticky", top: 80 }}>
            {SIDEBAR}
          </div>
        </div>

        {/* SIDEBAR — mobile (below all sections) */}
        <div className="md:hidden mb-8">
          {SIDEBAR}
        </div>
      </div>
    </div>
  );
}
