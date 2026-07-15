import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { followListDisplayName } from "@/lib/follow-users";

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalXP: number;
}

const RESULT_LIMIT = 8;

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  email: true,
  avatarUrl: true,
  totalXP: true,
} as const;

type DbUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalXP: number;
};

function toResults(users: DbUser[]): UserSearchResult[] {
  return users
    .filter((u): u is DbUser & { username: string } => !!u.username)
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: followListDisplayName(u),
      avatarUrl: u.avatarUrl,
      totalXP: u.totalXP,
    }));
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(
    `user-search:${session.user.id}`,
    30,
    60000
  );
  if (!success) return rateLimitResponse();

  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") ?? "").trim().toLowerCase().replace(/^@/, "");

  if (raw.length < 1) {
    return NextResponse.json({ users: [] satisfies UserSearchResult[] });
  }

  const prefixUsers = await prisma.user.findMany({
    where: {
      username: { not: null },
      OR: [
        { username: { startsWith: raw, mode: "insensitive" } },
        { displayName: { startsWith: raw, mode: "insensitive" } },
      ],
      NOT: { id: session.user.id },
    },
    select: USER_SELECT,
    orderBy: { username: "asc" },
    take: RESULT_LIMIT,
  });

  let containsUsers: DbUser[] = [];
  if (prefixUsers.length < RESULT_LIMIT) {
    containsUsers = await prisma.user.findMany({
      where: {
        username: { not: null },
        OR: [
          { username: { contains: raw, mode: "insensitive" } },
          { displayName: { contains: raw, mode: "insensitive" } },
        ],
        NOT: {
          id: {
            in: [session.user.id, ...prefixUsers.map((u) => u.id)],
          },
        },
      },
      select: USER_SELECT,
      orderBy: { username: "asc" },
      take: RESULT_LIMIT - prefixUsers.length,
    });
  }

  const results = toResults([...prefixUsers, ...containsUsers]);

  return NextResponse.json({ users: results });
}
