import { headers } from "next/headers";
import { hybridSearch } from "@/lib/hybrid-search";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request): Promise<Response> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    (await headers()).get("x-real-ip") ??
    "unknown";

  const { success } = await rateLimit(`semantic:${ip}`, 10, 60000);
  if (!success) return rateLimitResponse();

  let body: { query?: unknown; limit?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const rawLimit = Number(body.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 50) : 20;

  const results = await hybridSearch(query, { limit });
  return Response.json({ results });
}
