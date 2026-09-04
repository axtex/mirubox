import { NextResponse } from "next/server";
import { syncBrowseShelves } from "@/lib/browse-sync";
import { cronAuthError } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily cron-job.org job — refreshes browse shelves from AniList into Postgres.
 * Auth: Authorization: Bearer $CRON_SECRET (required in every environment).
 */
export async function GET(req: Request): Promise<Response> {
  const denied = cronAuthError(req);
  if (denied) return denied;

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
