import { NextResponse } from "next/server";
import { syncBrowseShelves } from "@/lib/browse-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Daily Vercel Cron (Hobby: max 1/day) — refreshes browse shelves from AniList into Postgres.
 * Auth: Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncBrowseShelves();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("browse-sync cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
