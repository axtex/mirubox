import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

interface PatchBody {
  username?: unknown;
  displayName?: unknown;
  avatarUrl?: unknown;
  onboarded?: unknown;
  episodeNotifications?: unknown;
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const data: {
    username?: string;
    displayName?: string;
    name?: string;
    avatarUrl?: string | null;
    onboarded?: boolean;
    episodeNotifications?: boolean;
  } = {};

  if (body.username !== undefined) {
    const username = String(body.username).trim().toLowerCase();
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    data.username = username;
  }

  if (body.displayName !== undefined) {
    const displayName = String(body.displayName).trim().slice(0, 50);
    data.displayName = displayName;
    // Keep Auth.js `name` in sync — otherwise OAuth name stays stale in DB/session.
    if (displayName) data.name = displayName;
  }

  if (body.avatarUrl !== undefined) {
    const url = String(body.avatarUrl).trim();

    if (url.length > 2048) {
      return NextResponse.json({ error: "Avatar URL too long" }, { status: 400 });
    }

    // Allow DiceBear/Supabase-storage HTTPS URLs or relative paths; reject everything else.
    if (url && !url.startsWith("https://") && !url.startsWith("/")) {
      return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
    }

    data.avatarUrl = url || null;
  }

  if (body.onboarded !== undefined) {
    data.onboarded = Boolean(body.onboarded);
  }

  if (body.episodeNotifications !== undefined) {
    if (typeof body.episodeNotifications !== "boolean") {
      return NextResponse.json(
        { error: "episodeNotifications must be a boolean" },
        { status: 400 },
      );
    }
    data.episodeNotifications = body.episodeNotifications;
  }

  if (data.onboarded === true) {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });
    const finalUsername = data.username ?? existing?.username;
    if (!finalUsername || !USERNAME_REGEX.test(finalUsername)) {
      return NextResponse.json({ error: "Username is required to complete onboarding" }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      onboarded: true,
      episodeNotifications: true,
    },
  });

  return NextResponse.json({ user });
}
