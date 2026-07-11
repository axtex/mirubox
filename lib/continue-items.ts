import { prisma } from "@/lib/prisma";
import type { ContinueItem } from "@/components/home/ContinueCard";

export async function getContinueItems(userId: string): Promise<ContinueItem[]> {
  const entries = await prisma.trackerEntry.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    include: { anime: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  return entries.map((entry) => {
    const isManga = entry.mediaType === "MANGA";
    const total =
      entry.total ?? (isManga ? entry.anime.chapters : entry.anime.episodes);

    return {
      id: entry.animeId,
      title: entry.anime.titleEnglish ?? entry.anime.title,
      coverImage: entry.anime.coverImage,
      href: isManga ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`,
      progress: entry.progress,
      total,
      mediaType: isManga ? "MANGA" : "ANIME",
    };
  });
}
