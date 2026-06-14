import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true },
  });

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const nextLevelXp = level * 100;
  const progress = (xp % 100) / 100;

  return NextResponse.json({ xp, level, nextLevelXp, progress });
}
