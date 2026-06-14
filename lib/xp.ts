import { prisma } from "@/lib/prisma";

export async function awardXP(
  userId: string,
  amount: number,
  reason: string
): Promise<{ xp: number; level: number }> {
  await prisma.xpEvent.create({ data: { userId, amount, reason } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true, level: true },
  });

  const newLevel = Math.floor(user.xp / 100) + 1;
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
    return { xp: user.xp, level: newLevel };
  }

  return { xp: user.xp, level: user.level };
}
