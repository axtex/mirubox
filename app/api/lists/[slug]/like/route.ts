import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const list = await prisma.list.findUnique({
    where: { slug },
    select: { id: true, isPublic: true, userId: true },
  });

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!list.isPublic && list.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (list.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot like your own list" }, { status: 403 });
  }

  const existing = await prisma.listLike.findUnique({
    where: { userId_listId: { userId: session.user.id, listId: list.id } },
  });

  if (existing) {
    await prisma.listLike.delete({
      where: { userId_listId: { userId: session.user.id, listId: list.id } },
    });
  } else {
    await prisma.listLike.create({
      data: { userId: session.user.id, listId: list.id },
    });
  }

  const count = await prisma.listLike.count({ where: { listId: list.id } });
  return NextResponse.json({ liked: !existing, count });
}
