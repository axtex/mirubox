import { searchMedia } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { SearchFilters } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface SearchResultsProps {
  params: Record<string, string | string[] | undefined>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function isSemanticQuery(q: string): boolean {
  if (q.length > 25) return true;
  const semanticWords = ["like", "similar", "but", "with", "something", "that has", "about", "where", "feel", "vibe", "mood"];
  return semanticWords.some((w) => q.toLowerCase().includes(w));
}

interface DbAnimeRow {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  type: string;
  similarity: number;
}

function dbToCard(row: DbAnimeRow): AnimeCardType {
  return {
    id: row.id,
    title: { romaji: row.title, english: row.titleEnglish, native: null },
    coverImage: { large: row.coverImage, extraLarge: row.coverImage },
    bannerImage: null,
    genres: row.genres ?? [],
    episodes: null,
    chapters: null,
    status: null,
    season: null,
    seasonYear: null,
    averageScore: row.averageScore,
    popularity: null,
    format: row.format,
    type: row.type ?? "ANIME",
  };
}

export async function SearchResults({ params }: SearchResultsProps) {
  const query = str(params.q);
  const type = str(params.type) === "MANGA" ? "MANGA" : "ANIME";
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = Number(str(params.year)) || undefined;
  const sort = str(params.sort) || undefined;
  const page = Number(str(params.page)) || 1;

  // Semantic mode: long or descriptive queries on ANIME only
  if (query && isSemanticQuery(query) && type === "ANIME") {
    const { generateEmbedding } = await import("@/lib/embeddings");
    const { prisma } = await import("@/lib/prisma");

    let semanticRows: DbAnimeRow[] = [];
    try {
      const queryEmbedding = await generateEmbedding(query);
      const vectorStr = `[${queryEmbedding.join(",")}]`;

      semanticRows = await prisma.$queryRaw<DbAnimeRow[]>`
        SELECT
          id, title, "titleEnglish", "coverImage",
          genres, "averageScore", format, type,
          (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
        FROM "Anime"
        WHERE embedding IS NOT NULL
          AND (1 - (embedding <=> ${vectorStr}::vector)) > 0.25
        ORDER BY similarity DESC
        LIMIT 24
      `;
    } catch {
      // Fall through to AniList keyword search if vector search fails
    }

    if (semanticRows.length > 0) {
      return (
        <div>
          <p className="text-sm mb-2" style={{ color: "var(--fg-muted)" }}>
            Results based on meaning, not exact title
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {semanticRows.map((row) => (
              <div key={row.id} className="flex flex-col gap-1">
                <AnimeCard anime={dbToCard(row)} size="md" />
                <p
                  className="text-[10px] text-center"
                  style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
                >
                  {Math.round(row.similarity * 100)}% match
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    // If no semantic results, fall through to AniList search below
  }

  // Keyword search via AniList
  const filters: SearchFilters = {
    genres: genre ? [genre] : [],
    status: status || undefined,
    format: format || undefined,
    year,
    sort,
  };

  const results = await searchMedia(query, type, filters, page, 24);

  if (results.media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-4xl opacity-20">✦</span>
        <p style={{ color: "var(--fg-muted)" }} className="text-center">
          {query ? `No results for "${query}"` : "Nothing found. Try different filters."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>
        {results.pageInfo.total !== null ? (
          <>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
              {results.pageInfo.total.toLocaleString()}
            </span>{" "}
            results{query ? ` for "${query}"` : ""}
          </>
        ) : null}
      </p>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {results.media.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} size="md" />
        ))}
      </div>

      {results.pageInfo.lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])), page: String(page - 1) })}`}
              className="btn-ghost"
            >
              ← Prev
            </a>
          )}
          <span
            className="flex items-center px-4 text-sm"
            style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
          >
            {page} / {results.pageInfo.lastPage}
          </span>
          {results.pageInfo.hasNextPage && (
            <a
              href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])), page: String(page + 1) })}`}
              className="btn-ghost"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
