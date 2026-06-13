import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true },
  });

  return NextResponse.json({ xp: user?.xp ?? 0, level: user?.level ?? 1 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { amount?: unknown };
  const amount = Number(body.amount);

  if (isNaN(amount) || amount < 1) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const result = await awardXP(session.user.id, amount);
  return NextResponse.json(result);
}
