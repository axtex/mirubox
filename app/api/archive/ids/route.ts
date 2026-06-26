import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ entries: [] });
  }

  const entries = await prisma.watchlistEntry.findMany({
    where: { userId: session.user.id },
    select: { animeId: true, status: true, favourite: true },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.animeId,
      status: e.status,
      favourite: e.favourite,
    })),
  });
}
