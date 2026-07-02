import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ids: [] });
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId: session.user.id },
    select: { mediaId: true },
  });

  return NextResponse.json({ ids: favourites.map((f) => f.mediaId) });
}
