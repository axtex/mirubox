import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RANKS, computeRank } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totalXP: true, rank: true },
  });

  const totalXP = user?.totalXP ?? 0;
  const rank = user?.rank ?? computeRank(totalXP);
  const rankIndex = RANKS.findIndex((r) => r.name === rank);
  const nextRank = RANKS[rankIndex + 1] ?? null;
  const currentThreshold = RANKS[rankIndex]?.min ?? 0;
  const nextThreshold = nextRank?.min ?? currentThreshold;
  const progress = nextRank ? (totalXP - currentThreshold) / (nextThreshold - currentThreshold) : 1;

  return NextResponse.json({
    totalXP,
    rank,
    nextRank: nextRank?.name ?? null,
    nextRankAt: nextRank?.min ?? null,
    progress,
  });
}
