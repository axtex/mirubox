import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface FollowListUser {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  totalXP: number;
  isFollowing: boolean;
}

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  email: true,
  avatarUrl: true,
  totalXP: true,
} as const;

export function followListDisplayName(user: {
  displayName: string | null;
  name: string | null;
  email: string | null;
  username: string | null;
}): string {
  return (
    user.displayName ||
    user.name ||
    user.username ||
    user.email?.split("@")[0] ||
    "Anonymous"
  );
}

async function withFollowStatus(
  users: Array<
    Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "totalXP"> & {
      name: string | null;
      email: string | null;
    }
  >,
  viewerId: string | null
): Promise<FollowListUser[]> {
  if (!viewerId || users.length === 0) {
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: followListDisplayName(user),
      avatarUrl: user.avatarUrl,
      totalXP: user.totalXP,
      isFollowing: false,
    }));
  }

  const followingIds = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: users.map((u) => u.id) },
    },
    select: { followingId: true },
  });
  const followingSet = new Set(followingIds.map((f) => f.followingId));

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: followListDisplayName(user),
    avatarUrl: user.avatarUrl,
    totalXP: user.totalXP,
    isFollowing: followingSet.has(user.id),
  }));
}

export async function getFollowersList(
  targetUserId: string,
  viewerId: string | null
): Promise<FollowListUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: targetUserId },
    include: { follower: { select: USER_SELECT } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return withFollowStatus(
    rows.map((row) => row.follower),
    viewerId
  );
}

export async function getFollowingList(
  targetUserId: string,
  viewerId: string | null
): Promise<FollowListUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: targetUserId },
    include: { following: { select: USER_SELECT } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return withFollowStatus(
    rows.map((row) => row.following),
    viewerId
  );
}
