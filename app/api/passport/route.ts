import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { BadgeKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { badgeEmoji } from "@/lib/profile-data";
import { getRankProgress } from "@/lib/xp";
import { getAvatarSeed, getAvatarPngUrl } from "@/lib/avatar";
import { PassportCardOG, PASSPORT_OG_WIDTH, PASSPORT_OG_HEIGHT } from "@/components/profile/PassportCardOG";

const MEDIA_SELECT = { title: true, coverImage: true } as const;

function isCustomUpload(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return !url.includes("dicebear.com");
}

// satori (used by ImageResponse) can't decode woff2 — request Google Fonts with an
// old Chrome UA so it serves plain woff/ttf instead of the modern woff2 default.
async function loadGoogleFont(weight: 400 | 700): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Space+Mono:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36",
      },
    }
  ).then((res) => res.text());

  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/);
  if (!match) throw new Error("Could not resolve Space Mono font URL");

  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

export async function GET(req: NextRequest): Promise<Response> {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return new Response("Missing username", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      totalXP: true,
      userBadges: { select: { badge: true } },
      favouriteAnime: {
        orderBy: { order: "asc" },
        take: 3,
        include: { media: { select: MEDIA_SELECT } },
      },
      favouriteManga: {
        orderBy: { order: "asc" },
        take: 3,
        include: { media: { select: MEDIA_SELECT } },
      },
      trackerEntries: {
        where: { status: { in: ["COMPLETED", "IN_PROGRESS"] } },
        select: { status: true, mediaType: true, anime: { select: { genres: true } } },
      },
    },
  });

  if (!user || !user.username) {
    return new Response("Not found", { status: 404 });
  }

  const [ratedCount, listsCount] = await Promise.all([
    prisma.rating.count({ where: { userId: user.id } }),
    prisma.list.count({ where: { userId: user.id } }),
  ]);

  const watched = user.trackerEntries.filter(
    (e) => e.status === "COMPLETED" && e.mediaType === "ANIME"
  ).length;
  const read = user.trackerEntries.filter(
    (e) => e.status === "COMPLETED" && e.mediaType === "MANGA"
  ).length;

  const genreCounts: Record<string, number> = {};
  for (const entry of user.trackerEntries) {
    for (const genre of entry.anime.genres) {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
    }
  }
  const tasteProfile = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const earnedSet = new Set(user.userBadges.map((b) => b.badge));
  const allBadgeKeys = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];
  const badges = [
    ...allBadgeKeys.filter((k) => earnedSet.has(k)),
    ...allBadgeKeys.filter((k) => !earnedSet.has(k)),
  ]
    .slice(0, 6)
    .map((k) => ({
      key: k,
      label: BADGE_DEFINITIONS[k].name,
      emoji: badgeEmoji(k, BADGE_DEFINITIONS[k].name),
      earned: earnedSet.has(k),
    }));

  const progress = getRankProgress(user.totalXP);

  const seed = getAvatarSeed(user.username, user.id);
  const avatarUrl = isCustomUpload(user.avatarUrl)
    ? user.avatarUrl!
    : getAvatarPngUrl(seed, 248);

  const displayName =
    user.displayName || user.name || user.email?.split("@")[0] || "Anonymous";

  const [fontRegular, fontBold] = await Promise.all([
    loadGoogleFont(400),
    loadGoogleFont(700),
  ]);

  return new ImageResponse(
    PassportCardOG({
      username: user.username,
      displayName,
      avatarUrl,
      rank: { name: progress.name },
      currentXP: user.totalXP,
      stats: { watched, read, rated: ratedCount, lists: listsCount },
      favouriteAnime: user.favouriteAnime.map((f) => ({
        title: f.media.title,
        coverImage: f.media.coverImage ?? "",
      })),
      favouriteManga: user.favouriteManga.map((f) => ({
        title: f.media.title,
        coverImage: f.media.coverImage ?? "",
      })),
      tasteProfile,
      badges,
    }),
    {
      width: PASSPORT_OG_WIDTH,
      height: PASSPORT_OG_HEIGHT,
      emoji: "twemoji",
      fonts: [
        { name: "SpaceMono", data: fontRegular, weight: 400, style: "normal" },
        { name: "SpaceMono", data: fontBold, weight: 700, style: "normal" },
      ],
    }
  );
}
