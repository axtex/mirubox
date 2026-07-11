import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function GET(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? (await headers()).get("x-real-ip") ?? "unknown";
  const { success } = await rateLimit(`username-check:${ip}`, 30, 60000);
  if (!success) return rateLimitResponse();

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "";

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
