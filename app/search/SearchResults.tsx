import { searchMedia } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { hybridSearch } from "@/lib/hybrid-search";
import type { SearchFilters } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import type { HybridResult } from "@/lib/hybrid-search";

const IS_DEV = process.env.NODE_ENV === "development";

interface SearchResultsProps {
  params: Record<string, string | string[] | undefined>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function hybridToCard(r: HybridResult): AnimeCardType {
  return {
    id: r.id,
    title: { romaji: r.title, english: r.titleEnglish, native: null },
    coverImage: { large: r.coverImage, extraLarge: r.coverImage },
    bannerImage: null,
    genres: r.genres ?? [],
    episodes: null,
    chapters: null,
    status: null,
    season: null,
    seasonYear: null,
    averageScore: r.averageScore,
    popularity: null,
    format: r.format,
    type: r.type ?? "ANIME",
  };
}

function SourceBadge({ source }: { source: HybridResult["source"] }) {
  if (!IS_DEV) return null;
  const styles: Record<string, { bg: string; color: string }> = {
    semantic: { bg: "#6366f133", color: "#a5b4fc" },
    anilist: { bg: "#ffffff11", color: "#888" },
    both: { bg: "#22c55e22", color: "#4ade80" },
  };
  const s = styles[source] ?? styles.anilist;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
      style={{ background: s.bg, color: s.color }}
    >
      {source}
    </span>
  );
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

  // ── Hybrid search: any non-empty query on ANIME ───────────────────────
  if (query.length >= 2 && type === "ANIME") {
    let results: HybridResult[] = [];
    try {
      results = await hybridSearch(query, 24);
    } catch {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-4xl opacity-20">✦</span>
          <p style={{ color: "var(--fg-muted)" }}>Search unavailable — try again</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-4xl opacity-20">✦</span>
          <p style={{ color: "var(--fg-muted)" }}>No results for &ldquo;{query}&rdquo;</p>
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
            {results.length}
          </span>{" "}
          results for &ldquo;{query}&rdquo;
        </p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {results.map((r) => (
            <div key={r.id} className="flex flex-col gap-1">
              <AnimeCard anime={hybridToCard(r)} size="md" />
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {(r.source === "semantic" || r.source === "both") && r.similarity !== null && (
                  <p
                    className="text-[10px] text-center"
                    style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
                  >
                    {Math.round(r.similarity * 100)}% match
                  </p>
                )}
                <SourceBadge source={r.source} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Filter / browse mode: AniList with pagination ────────────────────
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
              href={`?${new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(params)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)])
                ),
                page: String(page - 1),
              })}`}
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
              href={`?${new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(params)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)])
                ),
                page: String(page + 1),
              })}`}
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
