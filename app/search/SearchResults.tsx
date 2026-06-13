import { searchMedia } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { SearchFilters } from "@/lib/anilist";

interface SearchResultsProps {
  params: Record<string, string | string[] | undefined>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
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

      {/* Pagination */}
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
