import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`notif-count:${session.user.id}`, 5, 60000);
  if (!success) return rateLimitResponse();

  const count = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({ count });
}
