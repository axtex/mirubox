import type { BadgeKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BADGE_DEFINITIONS,
  resolveBadgeName,
  SEASONAL_WATCHER_XP,
  type StaticBadgeKey,
} from "@/lib/badges";
import { isSeasonalWatcherBadge } from "@/lib/season";
import { followListDisplayName } from "@/lib/follow-users";
import type { ActivityItem, ProfileMedia } from "@/lib/profile-types";

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

export interface FeedUser {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface FeedEntry extends ActivityItem {
  user: FeedUser;
}

export interface FriendsFeedResult {
  feed: FeedEntry[];
  hasMore: boolean;
  nextCursor: string | null;
  isFollowingAnyone: boolean;
}

function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}__${id}`;
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  const sep = cursor.indexOf("__");
  if (sep === -1) return null;
  const createdAt = new Date(cursor.slice(0, sep));
  const id = cursor.slice(sep + 2);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}

async function getFollowingIds(userId: string): Promise<string[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return following.map((f) => f.followingId);
}

const FRIENDS_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  email: true,
  avatarUrl: true,
  totalXP: true,
} as const;

export interface FriendsMedia {
  id: number;
  type: string;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  episodes: number | null;
  chapters: number | null;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
}

export interface FriendsUser {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  totalXP: number;
}

export interface NowWatchingItem {
  id: string;
  progress: number;
  updatedAt: Date;
  user: FriendsUser;
  media: FriendsMedia;
}

export interface RecentlyCompletedItem {
  id: string;
  updatedAt: Date;
  user: FriendsUser;
  media: FriendsMedia;
}

export interface FriendsReviewItem {
  id: string;
  content: string | null;
  containsSpoilers: boolean;
  updatedAt: Date;
  rating: number;
  user: FriendsUser;
  media: FriendsMedia;
}

export interface CompatibilityEntry {
  user: FriendsUser;
  overlapCount: number;
  sharedGenres: string[];
}

export interface FriendsPageData {
  feed: FeedEntry[];
  hasMore: boolean;
  nextCursor: string | null;
  isFollowingAnyone: boolean;
  nowWatching: NowWatchingItem[];
  recentlyCompleted: RecentlyCompletedItem[];
  recentReviews: FriendsReviewItem[];
  compatibility: CompatibilityEntry[];
}

function toFriendsUser(user: {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalXP: number;
}): FriendsUser {
  return {
    id: user.id,
    username: user.username,
    displayName: followListDisplayName(user),
    avatarUrl: user.avatarUrl,
    totalXP: user.totalXP,
  };
}

function toFriendsMedia(
  anime: {
    id: number;
    type: string;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    episodes: number | null;
    chapters: number | null;
    format?: string | null;
    seasonYear?: number | null;
    averageScore?: number | null;
  },
  mediaTypeOverride?: string | null
): FriendsMedia {
  return {
    id: anime.id,
    type: mediaTypeOverride === "MANGA" || mediaTypeOverride === "ANIME"
      ? mediaTypeOverride
      : anime.type,
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    coverImage: anime.coverImage,
    episodes: anime.episodes,
    chapters: anime.chapters,
    format: anime.format ?? null,
    seasonYear: anime.seasonYear ?? null,
    averageScore: anime.averageScore ?? null,
  };
}

const ANIME_FRIENDS_SELECT = {
  id: true,
  type: true,
  title: true,
  titleEnglish: true,
  coverImage: true,
  episodes: true,
  chapters: true,
  format: true,
  seasonYear: true,
  averageScore: true,
} as const;

export async function loadFriendsPageData(
  userId: string
): Promise<FriendsPageData> {
  const followingIds = await getFollowingIds(userId);
  const isFollowingAnyone = followingIds.length > 0;

  if (!isFollowingAnyone) {
    return {
      feed: [],
      hasMore: false,
      nextCursor: null,
      isFollowingAnyone: false,
      nowWatching: [],
      recentlyCompleted: [],
      recentReviews: [],
      compatibility: [],
    };
  }

  const myArchivePromise = prisma.trackerEntry.findMany({
    where: { userId },
    select: { animeId: true },
  });

  const [
    feedResult,
    nowWatchingRows,
    completedRows,
    ratingRows,
    myArchive,
    followedUsers,
  ] = await Promise.all([
    loadFriendsFeed(userId, { take: 50, followingIds }),
    prisma.trackerEntry.findMany({
      where: {
        userId: { in: followingIds },
        status: "IN_PROGRESS",
      },
      include: {
        user: { select: FRIENDS_USER_SELECT },
        anime: { select: ANIME_FRIENDS_SELECT },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.trackerEntry.findMany({
      where: {
        userId: { in: followingIds },
        status: "COMPLETED",
      },
      include: {
        user: { select: FRIENDS_USER_SELECT },
        anime: { select: ANIME_FRIENDS_SELECT },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.rating.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: { select: FRIENDS_USER_SELECT },
        anime: { select: ANIME_FRIENDS_SELECT },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    myArchivePromise,
    prisma.user.findMany({
      where: { id: { in: followingIds } },
      select: FRIENDS_USER_SELECT,
    }),
  ]);

  const ratingKeys = ratingRows.map((r) => ({
    userId: r.userId,
    animeId: r.animeId,
  }));

  const reviewRows =
    ratingKeys.length > 0
      ? await prisma.review.findMany({
          where: {
            OR: ratingKeys.map((k) => ({
              userId: k.userId,
              animeId: k.animeId,
            })),
          },
          select: {
            userId: true,
            animeId: true,
            content: true,
            containsSpoilers: true,
          },
        })
      : [];

  const reviewMap = new Map(
    reviewRows.map(
      (r) =>
        [
          `${r.userId}:${r.animeId}`,
          {
            content: r.content,
            containsSpoilers: r.containsSpoilers,
          },
        ] as const
    )
  );

  const nowWatching: NowWatchingItem[] = nowWatchingRows.map((row) => ({
    id: row.id,
    progress: row.progress,
    updatedAt: row.updatedAt,
    user: toFriendsUser(row.user),
    media: toFriendsMedia(row.anime, row.mediaType),
  }));

  const recentlyCompleted: RecentlyCompletedItem[] = completedRows.map(
    (row) => ({
      id: row.id,
      updatedAt: row.updatedAt,
      user: toFriendsUser(row.user),
      media: toFriendsMedia(row.anime, row.mediaType),
    })
  );

  const recentReviews: FriendsReviewItem[] = ratingRows.map((row) => {
    const review = reviewMap.get(`${row.userId}:${row.animeId}`);
    return {
      id: row.id,
      content: review?.content ?? null,
      containsSpoilers: review?.containsSpoilers ?? false,
      updatedAt: row.updatedAt,
      rating: row.score,
      user: toFriendsUser(row.user),
      media: toFriendsMedia(row.anime),
    };
  });

  const myMediaIds = myArchive.map((e) => e.animeId);
  let compatibility: CompatibilityEntry[] = followedUsers.map((user) => ({
    user: toFriendsUser(user),
    overlapCount: 0,
    sharedGenres: [],
  }));

  if (myMediaIds.length > 0) {
    const theirArchives = await prisma.trackerEntry.findMany({
      where: {
        userId: { in: followingIds },
        animeId: { in: myMediaIds },
      },
      select: {
        userId: true,
        animeId: true,
        anime: { select: { genres: true } },
      },
    });

    compatibility = followedUsers
      .map((user) => {
        const overlap = theirArchives.filter((e) => e.userId === user.id);
        const genreFreq: Record<string, number> = {};
        for (const e of overlap) {
          for (const g of e.anime.genres) {
            genreFreq[g] = (genreFreq[g] ?? 0) + 1;
          }
        }
        const sharedGenres = Object.entries(genreFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genre]) => genre);

        return {
          user: toFriendsUser(user),
          overlapCount: overlap.length,
          sharedGenres,
        };
      })
      .sort((a, b) => b.overlapCount - a.overlapCount);
  } else {
    compatibility = compatibility.sort((a, b) =>
      (a.user.username ?? "").localeCompare(b.user.username ?? "")
    );
  }

  return {
    feed: feedResult.feed,
    hasMore: feedResult.hasMore,
    nextCursor: feedResult.nextCursor,
    isFollowingAnyone: true,
    nowWatching,
    recentlyCompleted,
    recentReviews,
    compatibility,
  };
}

function mapXpToFeedEntry(
  e: {
    id: string;
    action: ActivityItem["action"];
    amount: number;
    createdAt: Date;
    mediaId: number | null;
    listId: string | null;
    meta: unknown;
    user: {
      id: string;
      username: string | null;
      displayName: string | null;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
    };
  },
  mediaMap: Map<number, ProfileMedia>,
  listMap: Map<
    string,
    {
      id: string;
      slug: string;
      title: string;
      isPublic: boolean;
      _count: { entries: number };
    }
  >
): FeedEntry {
  const meta = (e.meta ?? null) as Record<string, unknown> | null;
  const badgeKey = meta?.badge as BadgeKey | undefined;
  const seasonKey = meta?.season as string | undefined;
  const badgeName =
    badgeKey != null ? resolveBadgeName(badgeKey, seasonKey) : null;
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
    badgeName,
    badgeDescription: badgeName
      ? `${staticDef?.xp ?? SEASONAL_WATCHER_XP} XP badge`
      : null,
    meta,
    relatedUser: null,
    user: {
      id: e.user.id,
      username: e.user.username,
      displayName: followListDisplayName(e.user),
      avatarUrl: e.user.avatarUrl,
    },
  };
}

export async function loadFriendsFeed(
  userId: string,
  opts: {
    take?: number;
    cursor?: string | null;
    followingIds?: string[];
  } = {}
): Promise<FriendsFeedResult> {
  const take = opts.take ?? 50;
  const fetchLimit = take + 1;

  const followingIds = opts.followingIds ?? (await getFollowingIds(userId));
  const isFollowingAnyone = followingIds.length > 0;

  if (!isFollowingAnyone) {
    return {
      feed: [],
      hasMore: false,
      nextCursor: null,
      isFollowingAnyone: false,
    };
  }

  const decoded = opts.cursor ? decodeCursor(opts.cursor) : null;

  const events = await prisma.xPTransaction.findMany({
    where: {
      userId: { in: followingIds },
      action: { notIn: ["ADD_FRIEND", "DAILY_LOGIN"] },
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: decoded.createdAt } },
              { createdAt: decoded.createdAt, id: { lt: decoded.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: fetchLimit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasMore = events.length > take;
  const page = events.slice(0, take);

  const mediaIds = [
    ...new Set(
      page.map((e) => e.mediaId).filter((id): id is number => id != null)
    ),
  ];
  const listIds = [
    ...new Set(
      page.map((e) => e.listId).filter((id): id is string => id != null)
    ),
  ];

  const [mediaRows, listRows] = await Promise.all([
    mediaIds.length
      ? prisma.anime.findMany({
          where: { id: { in: mediaIds } },
          select: MEDIA_SELECT,
        })
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

  const feed = page.map((e) => mapXpToFeedEntry(e, mediaMap, listMap));

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

  return {
    feed,
    hasMore,
    nextCursor,
    isFollowingAnyone: true,
  };
}

export async function getFollowCounts(userId: string): Promise<{
  followingCount: number;
  followersCount: number;
}> {
  const [followingCount, followersCount] = await Promise.all([
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);
  return { followingCount, followersCount };
}
