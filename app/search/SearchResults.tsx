import { ChevronLeft, ChevronRight } from "lucide-react";
import { searchMedia } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { hybridSearch } from "@/lib/hybrid-search";
import { ANIME_DISCOVER, MANGA_DISCOVER } from "@/lib/discover-entries";
import { StatusMessage } from "@/components/ui/StatusMessage";
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

function ResultsLabel({ query, mode }: { query: string; mode: "ai" | "browse" }) {
  const truncated = query.length > 30 ? `${query.slice(0, 30)}…` : query;
  const left = mode === "browse" && !query ? "RESULTS" : `RESULTS FOR "${truncated.toUpperCase()}"`;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 0 8px 0", marginTop: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          letterSpacing: "0.08em",
          color: "var(--fg-subtle)",
          textTransform: "uppercase",
        }}
      >
        {left}
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
  if (query.length >= 2 && !isBrowseMode) {
    let results: HybridResult[] = [];
    try {
      results = await hybridSearch(query, { type });
    } catch {
      return <EmptyState message="SEARCH UNAVAILABLE — TRY AGAIN" />;
    }

    if (results.length === 0) {
      return <DiscoverEmptyState query={query} type={type} />;
    }

    const hasFallback = results.some((r) => r._isFallback);

    return (
      <div>
        {hasFallback && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-subtle)",
              marginBottom: 8,
            }}
          >
            No exact matches — showing similar titles
          </p>
        )}
        <ResultsLabel query={query} mode="ai" />
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
      <ResultsLabel query={query} mode="browse" />

      <div className={GRID}>
        {results.media.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} size="md" />
        ))}
      </div>

      {results.pageInfo.lastPage > 1 && (
        <div className="flex items-center justify-center mt-10" style={{ gap: 10 }}>
          {page > 1 ? (
            <a
              href={`?${new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                ),
                page: String(page - 1),
              })}`}
              aria-label="Previous page"
              className="scroll-row-arrow"
            >
              <ChevronLeft size={12} strokeWidth={2} />
            </a>
          ) : (
            <button type="button" disabled aria-label="Previous page" className="scroll-row-arrow">
              <ChevronLeft size={12} strokeWidth={2} />
            </button>
          )}
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
            }}
          >
            {page} / {results.pageInfo.lastPage}
          </span>
          {results.pageInfo.hasNextPage ? (
            <a
              href={`?${new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                ),
                page: String(page + 1),
              })}`}
              aria-label="Next page"
              className="scroll-row-arrow"
            >
              <ChevronRight size={12} strokeWidth={2} />
            </a>
          ) : (
            <button type="button" disabled aria-label="Next page" className="scroll-row-arrow">
              <ChevronRight size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BrowseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
      <StatusMessage block>No results.</StatusMessage>
      <StatusMessage block>Try adjusting your filters.</StatusMessage>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
      <StatusMessage block>{message}</StatusMessage>
    </div>
  );
}

function DiscoverEmptyState({ query, type }: { query: string; type: "ANIME" | "MANGA" }) {
  const prompts = (type === "MANGA" ? MANGA_DISCOVER : ANIME_DISCOVER)
    .slice(0, 4)
    .map((entry) => entry.label);

  const isTitleQuery = query.trim().split(/\s+/).length === 1;
  const message = isTitleQuery
    ? `No titles matching '${query}' found. Try the full title or check spelling.`
    : `No mood matches found for '${query}'. Try rephrasing — describe a feeling, theme, or genre.`;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--fg)",
          marginBottom: 6,
          maxWidth: 400,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {prompts.map((prompt) => (
          <a
            key={prompt}
            href={`?${new URLSearchParams({ tab: "ai", q: prompt, type })}`}
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
