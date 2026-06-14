import { hybridSearch } from "@/lib/hybrid-search";

export async function POST(req: Request) {
  const body = await req.json() as { query?: string; limit?: number };
  const query = body.query?.trim() ?? "";
  const limit = body.limit ?? 20;

  if (!query) {
    return Response.json({ results: [] });
  }

  const results = await hybridSearch(query, limit);
  return Response.json({ results });
}
