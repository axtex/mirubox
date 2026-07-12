import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSeasonChallenge } from "@/lib/season-challenge";
import { toContinueStripSeasonChallenge } from "@/lib/season-challenge-client";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(null);
  }

  const data = await getSeasonChallenge(session.user.id);
  if (!data?.showOnHome) {
    return NextResponse.json(null);
  }

  return NextResponse.json(toContinueStripSeasonChallenge(data));
}
