import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentActivity } from "@/lib/profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getRecentActivity(session.user.id, 10);

  return NextResponse.json({ events });
}
