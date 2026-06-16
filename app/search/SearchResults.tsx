import { searchMedia } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { hybridSearch } from "@/lib/hybrid-search";
import type { SearchFilters } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import type { HybridResult } from "@/lib/hybrid-search";

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

const GRID = "grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3";

export async function SearchResults({ params }: SearchResultsProps) {
  const query = str(params.q);
  const type = str(params.type) === "MANGA" ? "MANGA" : "ANIME";
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = Number(str(params.year)) || undefined;
  const sort = str(params.sort) || undefined;
  const page = Number(str(params.page)) || 1;

  /* ── Hybrid semantic search ──────────────────────────────────────── */
  if (query.length >= 2 && type === "ANIME") {
    let results: HybridResult[] = [];
    try {
      results = await hybridSearch(query, 28);
    } catch {
      return <EmptyState message="SEARCH UNAVAILABLE — TRY AGAIN" />;
    }

    if (results.length === 0) {
      return <EmptyState query={query} />;
    }

    return (
      <div>
        <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>
          <span style={{ color: "var(--fg)" }}>{results.length}</span> RESULTS FOR &ldquo;{query.toUpperCase()}&rdquo;
        </p>
        <div className={GRID}>
          {results.map((r) => (
            <AnimeCard
              key={r.id}
              anime={hybridToCard(r)}
              size="md"
              similarity={(r.source === "semantic" || r.source === "both") && r.similarity !== null ? r.similarity : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Browse / filter mode ────────────────────────────────────────── */
  const filters: SearchFilters = {
    genres: genre ? [genre] : [],
    status: status || undefined,
    format: format || undefined,
    year,
    sort,
  };

  const results = await searchMedia(query, type, filters, page, 28);

  if (results.media.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <div>
      {results.pageInfo.total !== null && (
        <p className="text-label mb-4" style={{ color: "var(--fg-subtle)" }}>
          <span style={{ color: "var(--fg)" }}>{results.pageInfo.total.toLocaleString()}</span>
          {" "}RESULTS{query ? ` FOR "${query.toUpperCase()}"` : ""}
        </p>
      )}

      <div className={GRID}>
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
                  Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                ),
                page: String(page - 1),
              })}`}
              className="btn-ghost"
            >
              ← PREV
            </a>
          )}
          <span className="flex items-center px-4 text-label" style={{ color: "var(--fg-muted)" }}>
            {page} / {results.pageInfo.lastPage}
          </span>
          {results.pageInfo.hasNextPage && (
            <a
              href={`?${new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                ),
                page: String(page + 1),
              })}`}
              className="btn-ghost"
            >
              NEXT →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ query, message }: { query?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div
        className="font-display"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: "clamp(64px, 12vw, 96px)",
          fontWeight: 800,
          color: "var(--fg-subtle)",
          lineHeight: 1,
          opacity: 0.3,
        }}
      >
        ?
      </div>
      <p className="text-headline-md font-display" style={{ color: "var(--fg-muted)" }}>
        {message ?? (query ? `NO RESULTS FOR "${query.toUpperCase()}"` : "NOTHING FOUND")}
      </p>
      <p className="text-label" style={{ color: "var(--fg-subtle)", maxWidth: 320 }}>
        TRY A BROADER SEARCH OR DESCRIBE WHAT YOU&apos;RE LOOKING FOR
      </p>
    </div>
  );
}
