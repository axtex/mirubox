import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  expandTitleSearchTerms,
  isLikelyAcronym,
  titleMatchesAcronym,
} from "@/lib/title-aliases";

export interface TitleSearchResult {
  id: number;
  type: string;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  averageScore: number | null;
  popularity: number | null;
}

const TITLE_SELECT = {
  id: true,
  type: true,
  title: true,
  titleEnglish: true,
  coverImage: true,
  averageScore: true,
  popularity: true,
} as const;

async function searchByTerms(terms: string[], type: string): Promise<TitleSearchResult[]> {
  if (terms.length === 0) return [];

  const patterns = terms.map((term) => `%${term}%`);
  const prefixes = terms.map((term) => `${term}%`);
  const conditions = patterns.flatMap((pattern) => [
    Prisma.sql`title ILIKE ${pattern}`,
    Prisma.sql`"titleEnglish" ILIKE ${pattern}`,
    Prisma.sql`"titleNative" ILIKE ${pattern}`,
  ]);
  const prefixConditions = prefixes.flatMap((prefix) => [
    Prisma.sql`title ILIKE ${prefix}`,
    Prisma.sql`"titleEnglish" ILIKE ${prefix}`,
  ]);

  return prisma.$queryRaw<TitleSearchResult[]>`
    SELECT
      id,
      type,
      title,
      "titleEnglish",
      "coverImage",
      "averageScore",
      popularity
    FROM "Anime"
    WHERE type = ${type}
      AND (${Prisma.join(conditions, " OR ")})
    ORDER BY
      CASE WHEN ${Prisma.join(prefixConditions, " OR ")} THEN 0 ELSE 1 END,
      popularity DESC NULLS LAST
    LIMIT 12
  `;
}

async function searchByAcronym(acronym: string, type: string): Promise<TitleSearchResult[]> {
  const candidates = await prisma.anime.findMany({
    where: { type },
    orderBy: { popularity: "desc" },
    take: 4000,
    select: TITLE_SELECT,
  });

  return candidates
    .filter((row) => {
      const titles = [row.title, row.titleEnglish].filter((t): t is string => Boolean(t));
      return titleMatchesAcronym(titles, acronym);
    })
    .slice(0, 12);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const key = session?.user?.id
    ? `title-search:${session.user.id}`
    : `title-search:${(await headers()).get("x-forwarded-for") ?? (await headers()).get("x-real-ip") ?? "unknown"}`;

  const { success } = await rateLimit(key, 30, 60000);
  if (!success) return rateLimitResponse();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") === "MANGA" ? "MANGA" : "ANIME";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.slice(0, 100);

  try {
    const terms = expandTitleSearchTerms(query);
    let results = await searchByTerms(terms, type);

    if (results.length === 0 && isLikelyAcronym(query)) {
      results = await searchByAcronym(query, type);
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Title search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
