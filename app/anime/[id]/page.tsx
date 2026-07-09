import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getMediaById, getDisplayTitle, splitLastWord } from "@/lib/anilist";
import { embedIfMissing } from "@/lib/embed-if-missing";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DescriptionToggle } from "@/components/anime/detail/DescriptionToggle";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { DetailHeroScore } from "@/components/detail/DetailHeroScore";
import { DetailSidebar } from "@/components/detail/DetailSidebar";
import { AnimeCharacterSection } from "@/components/detail/AnimeCharacterSection";
import { AnimeVASection } from "@/components/detail/AnimeVASection";
import type { AnimeCard as AnimeCardType, Relation } from "@/types/anilist";

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

const VALID_RELATION_TYPES = new Set([
  "SEQUEL", "PREQUEL", "ALTERNATIVE_VERSION", "ADAPTATION", "PARENT",
]);

const ANIME_STREAMING_SITES = new Set([
  "Crunchyroll", "Netflix", "HiDive", "Amazon Prime Video",
  "Funimation", "Disney+", "ADN", "Wakanim", "Bilibili", "YouTube",
]);

function relationToCard(node: Relation): AnimeCardType {
  return {
    id: node.id,
    title: node.title,
    coverImage: node.coverImage,
    bannerImage: null,
    genres: [],
    episodes: null,
    chapters: null,
    status: node.status,
    season: null,
    seasonYear: null,
    averageScore: null,
    popularity: null,
    format: node.format,
    type: node.type,
    tags: [],
    rankings: [],
  };
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const [media, session] = await Promise.all([getMediaById(numId), auth()]);
  if (!media) notFound();

  void embedIfMissing(media);

  const title = getDisplayTitle(media.title);
  const nativeTitle =
    media.title.native && media.title.native !== title ? media.title.native : null;
  const { leading: titleLeading, lastWord: titleLastWord } = splitLastWord(title);

  let userProgress = 0;
  let userRating: number | null = null;
  let userReview: { content: string; containsSpoilers: boolean } | null = null;

  if (session?.user?.id) {
    const [entry, rating, review] = await Promise.all([
      prisma.watchlistEntry
        .findUnique({
          where: { userId_animeId: { userId: session.user.id, animeId: numId } },
          select: { progress: true },
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
    userProgress = entry?.progress ?? 0;
    userRating = rating?.score ?? null;
    userReview = review;
  }

  const studio = media.studios?.nodes[0]?.name ?? null;

  const filteredRelations = media.relations.edges.filter((e) =>
    VALID_RELATION_TYPES.has(e.relationType)
  );

  const streamingLinks = media.externalLinks.filter((l) => ANIME_STREAMING_SITES.has(l.site));

  const recs = media.recommendations.nodes
    .map((n) => n.mediaRecommendation)
    .filter((m): m is AnimeCardType => m !== null)
    .slice(0, 6);

  // Next episode airing countdown
  let airingLabel: string | null = null;
  if (media.nextAiringEpisode && media.status === "RELEASING") {
    const secsLeft = media.nextAiringEpisode.airingAt - Date.now() / 1000;
    const hoursLeft = secsLeft / 3600;
    const daysLeft = Math.floor(secsLeft / 86400);
    if (secsLeft <= 0) {
      airingLabel = `EP ${media.nextAiringEpisode.episode} HAS AIRED`;
    } else if (hoursLeft < 24) {
      const h = Math.ceil(hoursLeft);
      airingLabel = `EP ${media.nextAiringEpisode.episode} AIRS IN ${h} ${h === 1 ? "HOUR" : "HOURS"}`;
    } else if (daysLeft === 0) {
      airingLabel = `EP ${media.nextAiringEpisode.episode} AIRS TODAY`;
    } else {
      airingLabel = `EP ${media.nextAiringEpisode.episode} AIRS IN ${daysLeft} ${daysLeft === 1 ? "DAY" : "DAYS"}`;
    }
  }

  // Characters — MAIN first
  const sortedChars = [...media.characters.edges].sort((a, b) => {
    if (a.role === "MAIN" && b.role !== "MAIN") return -1;
    if (a.role !== "MAIN" && b.role === "MAIN") return 1;
    return 0;
  });

  const sidebarDetails = [
    { label: "FORMAT",   value: media.format?.replace(/_/g, " ") },
    { label: "EPISODES", value: media.episodes ? String(media.episodes) : null },
    { label: "DURATION", value: media.duration ? `${media.duration} MIN` : null },
    { label: "STATUS",   value: media.status?.replace(/_/g, " ") },
    { label: "SEASON",   value: media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : null },
    { label: "STUDIO",   value: studio },
    { label: "SOURCE",   value: media.source?.replace(/_/g, " ") },
    { label: "SCORE",    value: media.averageScore !== null ? (media.averageScore / 10).toFixed(1) : null },
  ];

  const heroGenres = media.genres.slice(0, 5);

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
      tracker={{
        mediaId: numId,
        mediaType: "ANIME",
        title,
        total: media.episodes ?? null,
        initialProgress: userProgress,
        initialRating: userRating,
        initialReview: userReview,
      }}
      details={sidebarDetails}
      watchSection={{
        title: "WHERE TO WATCH",
        links: streamingLinks,
        emptyMessage: "No official streaming links found.",
      }}
      nextEpisodeLabel={airingLabel}
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
            style={{ background: "linear-gradient(to left, rgba(15,15,18,0.75) 0%, transparent 55%)" }}
          />
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

            <h1 style={{ fontFamily: "var(--font-anybody)", fontWeight: 600, fontSize: 18, lineHeight: 1.2, color: "#e4e1e6", marginBottom: 1 }}>
              {titleLeading}
              <span style={{ whiteSpace: "nowrap" }}>
                {titleLastWord}
                {media.averageScore !== null && (
                  <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 8 }}>
                    <DetailHeroScore score={media.averageScore} size="sm" />
                  </span>
                )}
              </span>
            </h1>
            {nativeTitle && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65", marginBottom: 8 }}>
                {nativeTitle}
              </p>
            )}

            {heroGenres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {heroGenres.map((g) => (
                  <span key={g} className="genre-chip">{g}</span>
                ))}
              </div>
            )}

          </div>

          {/* ── Desktop — poster and info block as flex siblings ────────── */}
          {/* maxWidth reserves the sidebar's column (220px width + 28px gap-7) so long
              titles wrap before running under where the sidebar sits below the hero. */}
          <div
            className="hidden md:flex"
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 16,
              marginTop: -80,
              maxWidth: "calc(100% - 248px)",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: 110,
                height: 165,
                flexShrink: 0,
                borderRadius: 2,
                border: "2px solid #2a2a2d",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {media.coverImage.extraLarge ? (
                <Image src={media.coverImage.extraLarge} alt={title} fill sizes="110px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#1b1b1e" }}>
                  <span style={{ fontSize: 24, color: "#5a5a65", fontFamily: "var(--font-space-mono)" }}>
                    {title[0]}
                  </span>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, overflow: "visible" }}>
              <h1
                style={{
                  fontFamily: "var(--font-anybody)",
                  fontWeight: 600,
                  fontSize: 22,
                  color: "#e4e1e6",
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "unset",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                  maxWidth: "100%",
                  marginBottom: 4,
                }}
              >
                {titleLeading}
                <span style={{ whiteSpace: "nowrap" }}>
                  {titleLastWord}
                  {media.averageScore !== null && (
                    <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 10 }}>
                      <DetailHeroScore score={media.averageScore} />
                    </span>
                  )}
                </span>
              </h1>
              {nativeTitle && (
                <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65", marginBottom: 8 }}>
                  {nativeTitle}
                </p>
              )}

              {heroGenres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {heroGenres.map((g) => (
                    <span key={g} className="genre-chip">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT ═════════════════════════════════════════════════════ */}
      <div className="page-container">
        <div className="flex gap-7 py-8" style={{ alignItems: "flex-start" }}>

          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-5 min-w-0" style={{ flex: 1 }}>

            {/* 1. SYNOPSIS */}
            {media.description && (
              <DescriptionToggle description={media.description} />
            )}

            {/* 2. CHARACTERS */}
            {sortedChars.length > 0 && (
              <AnimeCharacterSection chars={sortedChars} />
            )}

            {/* 3. VOICE ACTORS */}
            <AnimeVASection chars={sortedChars} />

            {/* 4. RELATED */}
            {filteredRelations.length > 0 && (
              <section>
                <p style={SECTION_TITLE}>RELATED</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {filteredRelations.map(({ node }) => (
                    <AnimeCard key={node.id} anime={relationToCard(node)} size="md" />
                  ))}
                </div>
              </section>
            )}

            {/* 5. RECOMMENDATIONS */}
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
          <div
            className="hidden md:block"
            style={{ width: 220, flexShrink: 0, position: "sticky", top: 16, marginTop: -128 }}
          >
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
