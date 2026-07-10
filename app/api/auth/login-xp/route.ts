import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, type ToastNotification } from "@/lib/xp";

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const result = await awardXP(userId, "DAILY_LOGIN");
  const notifications: ToastNotification[] = result ? [...result.notifications] : [];

  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (streak) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastLogin = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
    if (lastLogin) lastLogin.setHours(0, 0, 0, 0);

    const newLoginStreak = lastLogin?.getTime() === yesterday.getTime() ? streak.loginStreak + 1 : 1;

    await prisma.userStreak.update({
      where: { userId },
      data: {
        loginStreak: newLoginStreak,
        lastLoginDate: today,
      },
    });

    if (newLoginStreak === 7) {
      const streakResult = await awardXP(userId, "LOGIN_STREAK_7", { skipDuplicateCheck: true });
      if (streakResult) notifications.push(...streakResult.notifications);
    }
  }

  return NextResponse.json({ result, notifications });
}
