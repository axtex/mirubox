import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFollowingList } from "@/lib/follow-users";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext
): Promise<NextResponse> {
  const [{ username }, session] = await Promise.all([ctx.params, auth()]);

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const users = await getFollowingList(
    target.id,
    session?.user?.id ?? null
  );

  return NextResponse.json({ users });
}
