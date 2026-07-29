import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { entries: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const entries = await prisma.trackerEntry.findMany({
    where: { userId: session.user.id },
    select: {
      animeId: true,
      status: true,
      favourite: true,
      progress: true,
      total: true,
      mediaType: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      entries: entries.map((e) => ({
        id: e.animeId,
        status: e.status,
        favourite: e.favourite,
        progress: e.progress,
        total: e.total,
        mediaType: e.mediaType,
        updatedAt: e.updatedAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
