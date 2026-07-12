import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { awardXP } from "@/lib/xp";

interface RouteContext {
  params: Promise<{ username: string }>;
}

async function getTargetUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true },
  });
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
): Promise<NextResponse> {
  const { username } = await ctx.params;
  const session = await auth();

  const target = await getTargetUser(username);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [followersCount, followingCount, followRecord] = await Promise.all([
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
    session?.user?.id
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: target.id,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    followersCount,
    followingCount,
    isFollowing: !!followRecord,
  });
}

export async function POST(
  _req: NextRequest,
  ctx: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`follow:${session.user.id}`, 10, 60000);
  if (!success) return rateLimitResponse();

  const { username } = await ctx.params;
  const target = await getTargetUser(username);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot follow yourself" },
      { status: 400 }
    );
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: target.id,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ following: true });
    }
    throw err;
  }

  const follower = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, username: true },
  });
  const followerName =
    follower?.displayName ?? follower?.username ?? "Someone";

  await Promise.all([
    awardXP(session.user.id, "ADD_FRIEND"),
    createNotification({
      userId: target.id,
      type: "NEW_FOLLOWER",
      title: `${followerName} started following you`,
      fromUserId: session.user.id,
    }),
  ]);

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await ctx.params;
  const target = await getTargetUser(username);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: target.id,
    },
  });

  return NextResponse.json({ following: false });
}
