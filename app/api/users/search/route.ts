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

  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
      OR: [
        { username: { contains: raw, mode: "insensitive" } },
        { displayName: { contains: raw, mode: "insensitive" } },
      ],
      NOT: { id: session.user.id },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      email: true,
      avatarUrl: true,
      totalXP: true,
    },
    orderBy: { username: "asc" },
    take: 8,
  });

  const results: UserSearchResult[] = users
    .filter((u): u is typeof u & { username: string } => !!u.username)
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: followListDisplayName(u),
      avatarUrl: u.avatarUrl,
      totalXP: u.totalXP,
    }));

  return NextResponse.json({ users: results });
}
