import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMediaById } from "@/lib/anilist";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { ListDetailClient } from "@/components/lists/ListDetailClient";
import { ListsBackLink } from "@/components/lists/ListsBackLink";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const MEDIA_SELECT = {
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
} as const;

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

  const mediaIds = list.entries.map((e) => e.mediaId);
  let cachedMedia =
    mediaIds.length > 0
      ? await prisma.anime.findMany({
          where: { id: { in: mediaIds } },
          select: MEDIA_SELECT,
        })
      : [];

  const missingIds = mediaIds.filter((id) => !cachedMedia.some((m) => m.id === id));
  if (missingIds.length > 0) {
    await Promise.all(
      missingIds.map(async (id) => {
        const media = await getMediaById(id);
        if (media) await cacheAnimeCard(media);
      })
    );
    cachedMedia = await prisma.anime.findMany({
      where: { id: { in: mediaIds } },
      select: MEDIA_SELECT,
    });
  }

  const mediaMap = new Map(cachedMedia.map((m) => [m.id, m]));

  const entries: Array<{ card: AnimeCardType; note: string | null }> = list.entries
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
        tags: [],
        rankings: [],
      };
      return { card, note: entry.note };
    })
    .filter((x): x is { card: AnimeCardType; note: string | null } => x !== null);

  const username = list.isOfficial ? "mirubox" : (list.user?.name ?? "unknown");
  const mediaType =
    list.entries[0]?.mediaType === "MANGA" ? ("MANGA" as const) : ("ANIME" as const);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="page-container py-8">
        <ListsBackLink />

        <ListDetailClient
          slug={slug}
          title={list.title}
          description={list.description}
          isPublic={list.isPublic}
          isOfficial={list.isOfficial}
          isOwner={isOwner}
          username={username}
          mediaType={mediaType}
          entryCount={entries.length}
          likeCount={list._count.likes}
          isLiked={isLiked}
          isLoggedIn={!!session?.user?.id}
          updatedLabel={formatDate(list.updatedAt)}
          entries={entries}
        />
      </div>
    </div>
  );
}
