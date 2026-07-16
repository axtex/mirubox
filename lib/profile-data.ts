import { notFound } from "next/navigation";
import type { BadgeKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS, resolveBadgeName, SEASONAL_WATCHER_XP, type StaticBadgeKey } from "@/lib/badges";
import { isSeasonalWatcherBadge } from "@/lib/season";
import { getRankProgress } from "@/lib/xp";
import {
  getPastSeasonChallenges,
  getSeasonChallenge,
} from "@/lib/season-challenge";
import { getCurrentSeason, getSeasonKey } from "@/lib/season";
import { getAvatarSeed, getAvatarUrl } from "@/lib/avatar";
import { loadSocialActivity } from "@/lib/social-activity";
import type {
  ActivityItem,
  BadgeDisplay,
  GenreCount,
  ProfileData,
  ProfileListCard,
  ReviewItem,
  StreakDay,
} from "@/lib/profile-types";

export type {
  ProfileTabId,
  ProfileData,
  FavouriteSlot,
  GenreCount,
  BadgeDisplay,
  ActivityItem,
  ReviewItem,
  ProfileListCard,
  StreakDay,
  ProfileMedia,
} from "@/lib/profile-types";
export { PROFILE_TABS, parseProfileTab } from "@/lib/profile-types";

const MEDIA_SELECT = {
  id: true,
  title: true,
  titleEnglish: true,
  coverImage: true,
  format: true,
  seasonYear: true,
  type: true,
  episodes: true,
  chapters: true,
} as const;

const BADGE_EMOJI: Partial<Record<BadgeKey, string>> = {
  FIRST_FINISH: "🏁",
  SERIES_BINGER: "📺",
  COMPLETIONIST: "✅",
  CENTENARIAN: "💯",
  CINEPHILE: "🎬",
  FIRST_TAKE: "✍",
  CRITIC: "📝",
  BIG_RATER: "★",
  ON_A_ROLL: "🔥",
  COMMITTED: "💪",
  DEVOTED: "❤️",
  LIST_MAKER: "📋",
  TOP_100: "👑",
  GENRE_EXPLORER: "🧭",
  READER: "📖",
  BOOKWORM: "📚",
};

export function badgeEmoji(key: BadgeKey, name: string): string {
  return BADGE_EMOJI[key] ?? name.charAt(0).toUpperCase();
}

function displayNameOf(user: {
  displayName: string | null;
  name: string | null;
  email: string | null;
}): string {
  return user.displayName || user.name || user.email?.split("@")[0] || "Anonymous";
}

function countGenres(
  entries: Array<{ anime: { genres: string[] } }>
): GenreCount[] {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    for (const g of e.anime.genres) {
      counts[g] = (counts[g] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildWeekDays(activeDates: Set<string>): StreakDay[] {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const isToday = d.getTime() === today.getTime();
    const isFuture = d.getTime() > today.getTime();
    return {
      label,
      hasActivity: activeDates.has(key),
      isToday,
      isFuture,
    };
  });
}

async function loadLists(
  userId: string,
  opts: { publicOnly: boolean }
): Promise<{ yourLists: ProfileListCard[]; likedLists: ProfileListCard[] }> {
  const [userLists, liked] = await Promise.all([
    prisma.list.findMany({
      where: {
        userId,
        ...(opts.publicOnly ? { isPublic: true } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { entries: true, likes: true } },
        entries: {
          take: 4,
          orderBy: { order: "asc" },
          select: { mediaId: true },
        },
      },
    }),
    prisma.listLike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        list: {
          include: {
            user: { select: { username: true } },
            _count: { select: { entries: true, likes: true } },
            entries: {
              take: 4,
              orderBy: { order: "asc" },
              select: { mediaId: true },
            },
          },
        },
      },
    }),
  ]);

  const mediaIds = [
    ...new Set([
      ...userLists.flatMap((l) => l.entries.map((e) => e.mediaId)),
      ...liked.flatMap((l) => l.list.entries.map((e) => e.mediaId)),
    ]),
  ];
  const mediaMap = new Map<number, string | null>();
  if (mediaIds.length > 0) {
    const cached = await prisma.anime.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, coverImage: true },
    });
    for (const m of cached) mediaMap.set(m.id, m.coverImage);
  }

  const toCard = (
    l: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      isOfficial: boolean;
      isPublic: boolean;
      entries: { mediaId: number }[];
      _count: { entries: number; likes: number };
    },
    username: string | null
  ): ProfileListCard => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    description: l.description,
    isOfficial: l.isOfficial,
    isPublic: l.isPublic,
    username,
    entryCount: l._count.entries,
    likeCount: l._count.likes,
    coverPosters: l.entries.map((e) => mediaMap.get(e.mediaId) ?? null),
  });

  return {
    yourLists: userLists.map((l) => toCard(l, null)),
    likedLists: liked.map((ll) =>
      toCard(ll.list, ll.list.user?.username ?? null)
    ),
  };
}

async function loadActivity(
  userId: string,
  take = 50
): Promise<{ activity: ActivityItem[]; hasMore: boolean }> {
  const fetchLimit = take + 1;

  const [events, socialEvents] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId, action: { not: "ADD_FRIEND" } },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
    }),
    loadSocialActivity(userId, fetchLimit),
  ]);
  const hasMoreCombined =
    events.length > take || socialEvents.length > take;
  const xpPage = events.slice(0, take);

  const mediaIds = [
    ...new Set(xpPage.map((e) => e.mediaId).filter((id): id is number => id != null)),
  ];
  const listIds = [
    ...new Set(xpPage.map((e) => e.listId).filter((id): id is string => id != null)),
  ];

  const [mediaRows, listRows] = await Promise.all([
    mediaIds.length
      ? prisma.anime.findMany({ where: { id: { in: mediaIds } }, select: MEDIA_SELECT })
      : Promise.resolve([]),
    listIds.length
      ? prisma.list.findMany({
          where: { id: { in: listIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            isPublic: true,
            _count: { select: { entries: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const mediaMap = new Map(mediaRows.map((m) => [m.id, m]));
  const listMap = new Map(listRows.map((l) => [l.id, l]));

  const xpActivity: ActivityItem[] = xpPage.map((e) => {
    const meta = (e.meta ?? null) as Record<string, unknown> | null;
    const badgeKey = meta?.badge as BadgeKey | undefined;
    const seasonKey = meta?.season as string | undefined;
    const badgeName =
      badgeKey != null
        ? resolveBadgeName(badgeKey, seasonKey)
        : null;
    const staticDef =
      badgeKey && !isSeasonalWatcherBadge(badgeKey)
        ? BADGE_DEFINITIONS[badgeKey as StaticBadgeKey]
        : null;
    const list = e.listId ? listMap.get(e.listId) : null;

    return {
      id: e.id,
      action: e.action,
      amount: e.amount,
      createdAt: e.createdAt,
      media: e.mediaId != null ? (mediaMap.get(e.mediaId) ?? null) : null,
      listTitle: list?.title ?? null,
      listSlug: list?.slug ?? null,
      listEntryCount: list?._count.entries ?? null,
      listIsPublic: list?.isPublic ?? null,
      badgeName: badgeName,
      badgeDescription: badgeName
        ? `${staticDef?.xp ?? SEASONAL_WATCHER_XP} XP badge`
        : null,
      meta,
      relatedUser: null,
    };
  });

  const merged = [...xpActivity, ...socialEvents].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const hasMore = hasMoreCombined || merged.length > take;
  const activity = merged.slice(0, take);

  return { activity, hasMore };
}

export async function getProfileData(opts: {
  userId?: string;
  username?: string;
  viewerId?: string | null;
}): Promise<ProfileData> {
  const user = await prisma.user.findUnique({
    where: opts.userId
      ? { id: opts.userId }
      : { username: opts.username },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      totalXP: true,
      userBadges: { select: { badge: true, seasonKey: true, earnedAt: true } },
      userStreak: true,
    },
  });

  if (!user) notFound();

  const isOwnProfile = opts.viewerId === user.id;
  const publicOnly = !isOwnProfile;

  const weekStart = new Date();
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  const [
    topAnime,
    topManga,
    trackerForGenres,
    ratings,
    reviews,
    { activity, hasMore },
    weekTx,
    lists,
    watchedCount,
    readCount,
    followersCount,
    followingCount,
    isFollowing,
  ] = await Promise.all([
    prisma.favouriteAnime.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      take: 3,
      include: { media: { select: MEDIA_SELECT } },
    }),
    prisma.favouriteManga.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      take: 3,
      include: { media: { select: MEDIA_SELECT } },
    }),
    prisma.trackerEntry.findMany({
      where: {
        userId: user.id,
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
      },
      include: { anime: { select: { genres: true } } },
    }),
    prisma.rating.findMany({
      where: { userId: user.id },
      include: { anime: { select: MEDIA_SELECT } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      select: {
        animeId: true,
        content: true,
        containsSpoilers: true,
        updatedAt: true,
      },
    }),
    loadActivity(user.id, 50),
    prisma.xPTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: weekStart },
        action: { not: "DAILY_LOGIN" },
      },
      select: { createdAt: true },
    }),
    loadLists(user.id, { publicOnly }),
    prisma.trackerEntry.count({
      where: { userId: user.id, status: "COMPLETED", mediaType: "ANIME" },
    }),
    prisma.trackerEntry.count({
      where: { userId: user.id, status: "COMPLETED", mediaType: "MANGA" },
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    opts.viewerId
      ? prisma.follow
          .findUnique({
            where: {
              followerId_followingId: {
                followerId: opts.viewerId,
                followingId: user.id,
              },
            },
          })
          .then((f) => !!f)
      : Promise.resolve(false),
  ]);

  const genreSorted = countGenres(trackerForGenres);
  const reviewMap = new Map(reviews.map((r) => [r.animeId, r]));

  const reviewItems: ReviewItem[] = ratings.map((r) => {
    const rev = reviewMap.get(r.animeId);
    return {
      animeId: r.animeId,
      score: r.score,
      updatedAt: rev && rev.updatedAt > r.updatedAt ? rev.updatedAt : r.updatedAt,
      review: rev?.content?.trim() ? rev.content : null,
      containsSpoilers: rev?.containsSpoilers ?? false,
      media: r.anime,
    };
  });

  const ratingBuckets = new Map<number, number>();
  for (const r of ratings) {
    const bucket = Math.min(10, Math.max(1, Math.round(r.score)));
    ratingBuckets.set(bucket, (ratingBuckets.get(bucket) ?? 0) + 1);
  }
  const ratingDistributionFilled: { rating: number; count: number }[] = [];
  if (ratingBuckets.size > 0) {
    const lowestRated = Math.min(...ratingBuckets.keys());
    for (let s = 10; s >= lowestRated; s--) {
      ratingDistributionFilled.push({ rating: s, count: ratingBuckets.get(s) ?? 0 });
    }
  }

  const allBadgeKeys = Object.keys(BADGE_DEFINITIONS) as StaticBadgeKey[];

  const earnedNonSeasonal = new Map<BadgeKey, Date>();
  const earnedSeasonal: BadgeDisplay[] = [];

  for (const row of user.userBadges) {
    if (isSeasonalWatcherBadge(row.badge)) {
      const name = resolveBadgeName(row.badge, row.seasonKey);
      earnedSeasonal.push({
        key: row.badge,
        id: `${row.badge}_${row.seasonKey}`,
        seasonKey: row.seasonKey,
        name,
        emoji: badgeEmoji(row.badge, name),
        earned: true,
        earnedAt: row.earnedAt,
        description: `${SEASONAL_WATCHER_XP} XP`,
      });
    } else {
      earnedNonSeasonal.set(row.badge, row.earnedAt);
    }
  }

  earnedSeasonal.sort(
    (a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0)
  );

  const badges: BadgeDisplay[] = [
    ...earnedSeasonal,
    ...allBadgeKeys
      .filter((k) => earnedNonSeasonal.has(k))
      .map((k) => ({
        key: k,
        name: BADGE_DEFINITIONS[k].name,
        emoji: badgeEmoji(k, BADGE_DEFINITIONS[k].name),
        earned: true,
        earnedAt: earnedNonSeasonal.get(k) ?? null,
        description: `${BADGE_DEFINITIONS[k].xp} XP`,
      })),
    ...allBadgeKeys
      .filter((k) => !earnedNonSeasonal.has(k))
      .map((k) => ({
        key: k,
        name: BADGE_DEFINITIONS[k].name,
        emoji: badgeEmoji(k, BADGE_DEFINITIONS[k].name),
        earned: false,
        earnedAt: null,
        description: `${BADGE_DEFINITIONS[k].xp} XP`,
      })),
  ];

  const activeDates = new Set(
    weekTx.map((t) => {
      const d = new Date(t.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    })
  );

  const seed = getAvatarSeed(user.username, user.id);
  const earnedCount = badges.filter((b) => b.earned).length;

  const { season: currentSeason, year: currentYear } = getCurrentSeason();
  const currentSeasonKey = getSeasonKey(currentSeason, currentYear);
  const [seasonChallenge, pastSeasonChallenges] = await Promise.all([
    getSeasonChallenge(user.id),
    getPastSeasonChallenges(user.id, currentSeasonKey),
  ]);

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: displayNameOf(user),
      avatarUrl: user.avatarUrl,
      resolvedAvatarUrl: user.avatarUrl || getAvatarUrl(seed),
      totalXP: user.totalXP,
      followingCount,
      followersCount,
    },
    isOwnProfile,
    isFollowing,
    rank: getRankProgress(user.totalXP),
    badges,
    headerBadges: [
      ...badges.filter((b) => b.earned).slice(0, 5),
      ...badges
        .filter((b) => !b.earned)
        .slice(0, Math.max(0, 5 - Math.min(5, earnedCount))),
    ].slice(0, 5),
    favouriteAnime: topAnime.map((f) => ({
      mediaId: f.mediaId,
      order: f.order,
      media: f.media,
    })),
    favouriteManga: topManga.map((f) => ({
      mediaId: f.mediaId,
      order: f.order,
      media: f.media,
    })),
    tasteGenres: genreSorted.slice(0, 5),
    statsGenres: genreSorted.slice(0, 8),
    ratingDistribution: ratingDistributionFilled,
    stats: {
      watched: watchedCount,
      read: readCount,
      rated: ratings.length,
      lists: lists.yourLists.length,
    },
    streak: {
      current: user.userStreak?.currentStreak ?? 0,
      longest: user.userStreak?.longestStreak ?? 0,
      days: buildWeekDays(activeDates),
    },
    seasonChallenge,
    pastSeasonChallenges,
    activity,
    hasMoreActivity: hasMore,
    reviews: reviewItems,
    yourLists: lists.yourLists,
    likedLists: lists.likedLists,
  };
}
