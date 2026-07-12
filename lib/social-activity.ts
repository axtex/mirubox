import { prisma } from "@/lib/prisma";
import { followListDisplayName } from "@/lib/follow-users";
import type { ActivityItem, SocialActivityAction } from "@/lib/profile-types";

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

function toRelatedUser(user: {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string | null;
}): ActivityItem["relatedUser"] {
  return {
    id: user.id,
    username: user.username,
    displayName: followListDisplayName(user),
  };
}

export async function loadSocialActivity(
  userId: string,
  limit = 60
): Promise<ActivityItem[]> {
  const [following, followers, likesGiven, likesReceived] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { following: { select: USER_SELECT } },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { follower: { select: USER_SELECT } },
    }),
    prisma.listLike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        list: {
          select: {
            id: true,
            slug: true,
            title: true,
            isPublic: true,
            userId: true,
            user: { select: USER_SELECT },
            _count: { select: { entries: true } },
          },
        },
      },
    }),
    prisma.listLike.findMany({
      where: {
        list: { userId },
        NOT: { userId },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: USER_SELECT },
        list: {
          select: {
            id: true,
            slug: true,
            title: true,
            isPublic: true,
            _count: { select: { entries: true } },
          },
        },
      },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const row of following) {
    items.push({
      id: `follow-out-${row.followerId}-${row.followingId}`,
      action: "FOLLOWING",
      amount: 0,
      createdAt: row.createdAt,
      media: null,
      listTitle: null,
      listSlug: null,
      listEntryCount: null,
      listIsPublic: null,
      badgeName: null,
      badgeDescription: null,
      meta: null,
      relatedUser: toRelatedUser(row.following),
    });
  }

  for (const row of followers) {
    items.push({
      id: `follow-in-${row.followerId}-${row.followingId}`,
      action: "NEW_FOLLOWER",
      amount: 0,
      createdAt: row.createdAt,
      media: null,
      listTitle: null,
      listSlug: null,
      listEntryCount: null,
      listIsPublic: null,
      badgeName: null,
      badgeDescription: null,
      meta: null,
      relatedUser: toRelatedUser(row.follower),
    });
  }

  for (const row of likesGiven) {
    items.push({
      id: `list-like-out-${row.userId}-${row.listId}`,
      action: "LIST_LIKED",
      amount: 0,
      createdAt: row.createdAt,
      media: null,
      listTitle: row.list.title,
      listSlug: row.list.slug,
      listEntryCount: row.list._count.entries,
      listIsPublic: row.list.isPublic,
      badgeName: null,
      badgeDescription: null,
      meta: null,
      relatedUser:
        row.list.userId !== userId && row.list.user
          ? toRelatedUser(row.list.user)
          : null,
    });
  }

  for (const row of likesReceived) {
    items.push({
      id: `list-like-in-${row.userId}-${row.listId}`,
      action: "LIST_GOT_LIKED",
      amount: 0,
      createdAt: row.createdAt,
      media: null,
      listTitle: row.list.title,
      listSlug: row.list.slug,
      listEntryCount: row.list._count.entries,
      listIsPublic: row.list.isPublic,
      badgeName: null,
      badgeDescription: null,
      meta: null,
      relatedUser: toRelatedUser(row.user),
    });
  }

  return items.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function isSocialActivityAction(
  action: ActivityItem["action"]
): action is SocialActivityAction {
  return (
    action === "FOLLOWING" ||
    action === "NEW_FOLLOWER" ||
    action === "LIST_LIKED" ||
    action === "LIST_GOT_LIKED"
  );
}
