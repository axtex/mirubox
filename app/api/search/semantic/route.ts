import { auth } from "@/auth";
import { hybridSearch } from "@/lib/hybrid-search";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`semantic:${session.user.id}`, 20, 60000);
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
