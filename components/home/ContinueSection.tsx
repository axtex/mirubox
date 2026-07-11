import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContinueCarousel } from "@/components/home/ContinueCarousel";
import type { ContinueItem } from "@/components/home/ContinueCard";

export async function ContinueSection(): Promise<React.JSX.Element | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const entries = await prisma.trackerEntry.findMany({
    where: {
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
    include: { anime: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  if (entries.length === 0) return null;

  const items: ContinueItem[] = entries.map((entry) => {
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

  return <ContinueCarousel items={items} />;
}
