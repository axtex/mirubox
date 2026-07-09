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
    tags: [],
    rankings: [],
  };
}

const GRID = "grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3";

function ResultsLabel({ query, count, mode }: { query: string; count: number; mode: "ai" | "browse" }) {
  const truncated = query.length > 30 ? `${query.slice(0, 30)}…` : query;
  const left = mode === "browse" && !query ? "RESULTS" : `RESULTS FOR "${truncated.toUpperCase()}"`;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 8px 0", marginTop: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          letterSpacing: "0.08em",
          color: "#5a5a65",
          textTransform: "uppercase",
        }}
      >
        {left}
      </span>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#3a3a45" }}>
        {count} found
      </span>
    </div>
  );
}

export async function SearchResults({ params }: SearchResultsProps) {
  const query = str(params.q);
  const type = str(params.type) === "MANGA" ? "MANGA" : "ANIME";
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = Number(str(params.year)) || undefined;
  const season = str(params.season) || undefined;
  const sort = str(params.sort) || undefined;
  const page = Number(str(params.page)) || 1;

  const isBrowseMode = str(params.tab) === "browse";

  /* ── Hybrid semantic search ──────────────────────────────────────── */
  if (query.length >= 2 && type === "ANIME" && !isBrowseMode) {
    let results: HybridResult[] = [];
    try {
      results = await hybridSearch(query, { type: "ANIME" });
    } catch {
      return <EmptyState message="SEARCH UNAVAILABLE — TRY AGAIN" />;
    }

    if (results.length === 0) {
      return <DiscoverEmptyState />;
    }

    return (
      <div>
        <ResultsLabel query={query} count={results.length} mode="ai" />
        <div className={GRID}>
          {results.map((r) => (
            <AnimeCard key={r.id} anime={hybridToCard(r)} size="md" />
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
    season,
    sort,
  };

  const results = await searchMedia(query, type, filters, page, 28);

  if (results.media.length === 0) {
    return <BrowseEmptyState />;
  }

  return (
    <div>
      <ResultsLabel query={query} count={results.pageInfo.total ?? results.media.length} mode="browse" />

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

function BrowseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65" }}>
        No results.
      </p>
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65" }}>
        Try adjusting your filters.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "#5a5a65" }}>
        {message}
      </p>
    </div>
  );
}

const DISCOVER_EMPTY_PROMPTS = [
  "cozy witches",
  "found family in a broken world",
  "slow burn that wrecks you",
  "psychological thriller with a twist",
];

function DiscoverEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p style={{ fontSize: 14, fontWeight: 500, color: "#e4e1e6", marginBottom: 6 }}>
        No matches found
      </p>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
          color: "#5a5a65",
          lineHeight: 1.7,
          maxWidth: 360,
        }}
      >
        Try describing a mood, theme, or feeling — like &quot;slow burn romance&quot; or &quot;dark fantasy with good world-building&quot;.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {DISCOVER_EMPTY_PROMPTS.map((prompt) => (
          <a
            key={prompt}
            href={`?${new URLSearchParams({ tab: "ai", q: prompt })}`}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--fg-muted)",
              background: "var(--bg-elevated)",
              border: "1px dashed var(--bg-card-high)",
              borderRadius: 2,
              padding: "6px 12px",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            {prompt}
          </a>
        ))}
      </div>
    </div>
  );
}
