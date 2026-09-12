import { NextResponse } from "next/server";
import { seedCatalogue } from "@/lib/catalogue-seed";
import { cronAuthError } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * cron-job.org — upserts popular/seasonal catalogue rows into Postgres.
 * Auth: Authorization: Bearer $CRON_SECRET.
 * Skips while the AniList circuit is open.
 */
export async function GET(req: Request): Promise<Response> {
  const denied = cronAuthError(req);
  if (denied) return denied;

  try {
    const result = await seedCatalogue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("catalogue-seed cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}
