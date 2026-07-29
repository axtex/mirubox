import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ids: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId: session.user.id },
    select: { mediaId: true },
  });

  return NextResponse.json(
    { ids: favourites.map((f) => f.mediaId) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
