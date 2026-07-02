import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { LikeButton } from "@/components/lists/LikeButton";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function ListDetailPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  const list = await prisma.list.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true } },
      _count: { select: { likes: true } },
      entries: {
        orderBy: { order: "asc" },
        select: { id: true, mediaId: true, mediaType: true, order: true, note: true },
      },
      likes: session?.user?.id
        ? { where: { userId: session.user.id }, select: { userId: true } }
        : false,
    },
  });

  if (!list || (!list.isPublic && list.userId !== session?.user?.id)) {
    notFound();
  }

  const isOwner = !list.isOfficial && list.userId === session?.user?.id;
  const isLiked = Array.isArray(list.likes) && list.likes.length > 0;

  // Fetch media from DB cache
  const mediaIds = list.entries.map((e) => e.mediaId);
  const cachedMedia = mediaIds.length > 0
    ? await prisma.anime.findMany({
        where: { id: { in: mediaIds } },
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          coverImage: true,
          bannerImage: true,
          averageScore: true,
          format: true,
          type: true,
          genres: true,
          episodes: true,
          chapters: true,
          status: true,
          season: true,
          seasonYear: true,
          popularity: true,
        },
      })
    : [];

  const mediaMap = new Map(cachedMedia.map((m) => [m.id, m]));

  const animeCards: Array<{ card: AnimeCardType; note: string | null }> = list.entries
    .map((entry) => {
      const m = mediaMap.get(entry.mediaId);
      if (!m) return null;
      const card: AnimeCardType = {
        id: m.id,
        title: {
          romaji: m.title,
          english: m.titleEnglish ?? null,
          native: null,
        },
        coverImage: { large: m.coverImage ?? "", extraLarge: m.coverImage ?? "" },
        bannerImage: m.bannerImage ?? null,
        genres: m.genres,
        episodes: m.episodes ?? null,
        chapters: m.chapters ?? null,
        status: m.status ?? null,
        season: m.season ?? null,
        seasonYear: m.seasonYear ?? null,
        averageScore: m.averageScore ?? null,
        popularity: m.popularity ?? null,
        format: m.format ?? null,
        type: m.type as "ANIME" | "MANGA",
      };
      return { card, note: entry.note };
    })
    .filter((x): x is { card: AnimeCardType; note: string | null } => x !== null);

  const username = list.isOfficial ? "mirubox" : (list.user?.name ?? "unknown");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="page-container py-8">

        {/* Back link */}
        <Link
          href="/lists"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            textDecoration: "none",
            letterSpacing: "0.06em",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← LISTS
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          {list.isOfficial && (
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#e8173f",
                  background: "rgba(232,23,63,0.1)",
                  border: "1px solid rgba(232,23,63,0.2)",
                  borderRadius: 2,
                  padding: "2px 6px",
                  letterSpacing: "0.06em",
                }}
              >
                ✦ OFFICIAL LIST
              </span>
            </div>
          )}

          <h1 className="text-headline-lg font-display" style={{ marginBottom: 8 }}>
            {list.title}
          </h1>

          {list.description && (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 12,
                color: "var(--fg-muted)",
                maxWidth: 560,
                lineHeight: 1.55,
                marginBottom: 12,
              }}
            >
              {list.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
              }}
            >
              {list.entries.length} titles · by {username} · updated {formatDate(list.updatedAt)}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LikeButton
                slug={slug}
                initialLiked={isLiked}
                initialCount={list._count.likes}
                isLoggedIn={!!session?.user?.id}
              />
              {isOwner && (
                <Link
                  href={`/lists/${slug}/edit`}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    padding: "5px 12px",
                    border: "1px solid #2a2a2d",
                    borderRadius: 2,
                    color: "var(--fg-muted)",
                    textDecoration: "none",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  EDIT
                </Link>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
        </div>

        {/* Entries */}
        {animeCards.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 12,
              color: "var(--fg-muted)",
              padding: "32px 0",
            }}
          >
            {isOwner
              ? "Add titles to this list from any anime or manga detail page."
              : "This list is empty."}
          </p>
        ) : (
          <div className="section-cards md:grid md:grid-cols-6 lg:grid-cols-7">
            {animeCards.map(({ card, note }) => (
              <div key={card.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <AnimeCard anime={card} size="md" />
                {note && (
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      color: "var(--fg-subtle)",
                      fontStyle: "italic",
                      lineHeight: 1.4,
                      padding: "0 2px",
                    }}
                  >
                    {note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
