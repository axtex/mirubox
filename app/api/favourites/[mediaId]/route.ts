import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId: mediaIdStr } = await params;
  const mediaId = Number(mediaIdStr);
  if (isNaN(mediaId)) {
    return NextResponse.json({ error: "Invalid mediaId" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.favourite.deleteMany({
      where: { userId: session.user.id, mediaId },
    }),
    prisma.favouriteAnime.deleteMany({
      where: { userId: session.user.id, mediaId },
    }),
    prisma.favouriteManga.deleteMany({
      where: { userId: session.user.id, mediaId },
    }),
  ]);

  return NextResponse.json({ success: true });
}
