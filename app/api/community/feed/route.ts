import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadFriendsFeed } from "@/lib/community-feed";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  const result = await loadFriendsFeed(session.user.id, {
    take: 50,
    cursor,
  });

  return NextResponse.json({
    feed: result.feed,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  });
}
