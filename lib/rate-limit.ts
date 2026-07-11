import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  // 1% chance of cleanup on each call — fire and forget, don't await
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prisma.rateLimit
      .deleteMany({ where: { windowStart: { lt: cutoff } } })
      .catch(() => {});
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    const record = await prisma.rateLimit.findUnique({ where: { key } });

    if (!record || record.windowStart < windowStart) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { success: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
      return { success: false, remaining: 0 };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return { success: true, remaining: limit - (record.count + 1) };
  } catch {
    // If rate limit check fails for any reason (DB unavailable etc) —
    // fail open (allow the request) rather than blocking all users
    return { success: true, remaining: 1 };
  }
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}
