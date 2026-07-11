import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchMedia } from "@/lib/anilist";
import { expandTitleSearchTerms } from "@/lib/title-aliases";

export function normalizeTitleReference(reference: string): string {
  return reference
    .trim()
    .replace(/[!?.,:;]+$/g, "")
    .replace(/^[!?.,:;]+/g, "")
    .trim();
}

async function searchLocalByTerms(
  terms: string[],
  type: "ANIME" | "MANGA",
): Promise<number | null> {
  if (terms.length === 0) return null;

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

  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id
    FROM "Anime"
    WHERE type = ${type}
      AND (${Prisma.join(conditions, " OR ")})
    ORDER BY
      CASE WHEN ${Prisma.join(prefixConditions, " OR ")} THEN 0 ELSE 1 END,
      popularity DESC NULLS LAST
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

async function searchAniListByTerms(
  terms: string[],
  type: "ANIME" | "MANGA",
): Promise<number | null> {
  for (const term of terms) {
    const page = await searchMedia(term, type, {}, 1, 5);
    if (page.media.length > 0) return page.media[0].id;
  }
  return null;
}

/** Resolve a title reference (e.g. "haikyu", "haikyu!!") to a cached media ID. */
export async function resolveTitleToMediaId(
  reference: string,
  type: "ANIME" | "MANGA",
): Promise<number | null> {
  const normalized = normalizeTitleReference(reference);
  if (!normalized) return null;

  const terms = expandTitleSearchTerms(normalized);

  try {
    const localId = await searchLocalByTerms(terms, type);
    if (localId) return localId;
  } catch {
    /* DB unavailable */
  }

  try {
    return await searchAniListByTerms(terms, type);
  } catch (err) {
    console.error("AniList title resolve failed:", err);
    return null;
  }
}
