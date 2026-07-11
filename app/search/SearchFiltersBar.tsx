"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, useRef, useEffect, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { FilterSelect } from "@/components/FilterSelect";
import { SearchSkeletonGrid } from "@/components/search/SearchSkeletonGrid";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { SEARCH_DISCOVER_PROMPTS } from "@/lib/search-discover-prompts";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { TitleSearchResult } from "@/app/api/search/titles/route";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED"];
const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i));
const SEASONS = ["SPRING", "SUMMER", "FALL", "WINTER"];
const SORTS = [
  { value: "TRENDING_DESC", label: "TRENDING" },
  { value: "SCORE_DESC", label: "TOP RATED" },
  { value: "POPULARITY_DESC", label: "POPULAR" },
];

const BROWSE_DEBOUNCE_MS = 300;
const GRID = "grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3";

function titleResultToCard(r: TitleSearchResult): AnimeCardType {
  return {
    id: r.id,
    title: { romaji: r.title, english: r.titleEnglish, native: null },
    coverImage: { large: r.coverImage, extraLarge: r.coverImage },
    bannerImage: null,
    genres: [],
    episodes: null,
    chapters: null,
    status: null,
    season: null,
    seasonYear: null,
    averageScore: r.averageScore,
    popularity: r.popularity,
    format: null,
    type: r.type,
    tags: [],
    rankings: [],
  };
}

interface SearchFiltersBarProps {
  params: Record<string, string | string[] | undefined>;
  children?: ReactNode;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export function SearchFiltersBar({ params, children }: SearchFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tab = str(params.tab) || "browse";
  const [query, setQuery] = useState(str(params.q));
  const [focused, setFocused] = useState(false);

  const type = str(params.type) || "ANIME";
  const [titleResults, setTitleResults] = useState<TitleSearchResult[]>([]);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const genre = str(params.genre);
  const status = str(params.status);
  const year = str(params.year);
  const season = str(params.season);
  const sort = str(params.sort);

  const activeFilterCount = [genre, status, year, season, sort].filter(Boolean).length;
  const hasBrowseQuery = !!str(params.q);
  const hadResultsBefore = tab === "browse" ? (activeFilterCount > 0 || hasBrowseQuery) : hasBrowseQuery;

  // Auto-focus when coming from navbar click (?focus=true)
  useEffect(() => {
    if (str(params.focus) === "true") {
      inputRef.current?.focus();
      const url = new URL(window.location.href);
      url.searchParams.delete("focus");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "/" focuses the search input and selects its content when it isn't already focused
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key !== "/") return;
      if (document.activeElement === inputRef.current) return;
      const tagName = (e.target as HTMLElement)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA") return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Local title lookup (BROWSE only) — fills the results grid with instant matches
  // while the server-rendered results are still catching up to a partial word,
  // e.g. "haik" before "haikyu" completes.
  useEffect(() => {
    const q = query.trim();
    if (tab !== "browse" || q.length < 2) {
      setTitleResults([]);
      setTitlesLoading(false);
      return;
    }

    const controller = new AbortController();
    setTitlesLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search/titles?q=${encodeURIComponent(q)}&type=${type}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          setTitleResults(data.results ?? []);
          setTitlesLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setTitlesLoading(false);
        });
    }, BROWSE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, type, tab]);

  function buildHref(overrides: Record<string, string | undefined>): string {
    const current: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) current[k] = String(v);
    });
    const merged: Record<string, string | undefined> = { ...current, ...overrides };
    const next: Record<string, string> = {};
    const skip = new Set(["page", "focus", "mode"]);
    Object.keys(merged).forEach((k) => {
      if (merged[k] && !skip.has(k)) next[k] = merged[k] as string;
    });
    return `${pathname}?${new URLSearchParams(next)}`;
  }

  function navigate(overrides: Record<string, string | undefined>): void {
    startTransition(() => router.push(buildHref(overrides)));
  }

  function handleTabChange(newTab: "ai" | "browse"): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    navigate({
      tab: newTab,
      q: undefined,
      genre: undefined,
      status: undefined,
      format: undefined,
      year: undefined,
      season: undefined,
      sort: undefined,
    });
  }

  function handleSubmit(): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) return;
    // In BROWSE tab: keyword search through AniList. In AI tab: semantic search.
    navigate({ q, tab: tab === "browse" ? "browse" : "ai" });
  }

  function handleChipClick(prompt: string): void {
    setQuery(prompt);
    navigate({ q: prompt, tab: "ai", type });
  }

  function clearFilters(): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    navigate({
      q: undefined,
      genre: undefined,
      status: undefined,
      format: undefined,
      year: undefined,
      season: undefined,
      sort: undefined,
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value;
    setQuery(value);
    const trimmed = value.trim();

    if (tab === "browse") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (trimmed.length === 0) {
        if (str(params.q)) navigate({ q: undefined });
      } else if (trimmed.length >= 2) {
        debounceRef.current = setTimeout(() => navigate({ q: trimmed }), BROWSE_DEBOUNCE_MS);
      }
    } else if (trimmed.length === 0 && str(params.q)) {
      // AI mode: clearing the input immediately drops any prior results
      navigate({ q: undefined, tab: "ai" });
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      handleSubmit();
      return;
    }
    if (e.key === "Escape") {
      if (query.length > 0) {
        setQuery("");
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (str(params.q)) navigate({ q: undefined, tab: tab === "browse" ? "browse" : "ai" });
      } else {
        inputRef.current?.blur();
      }
    }
  }

  const placeholder = tab === "ai" ? "describe a mood, theme, or feeling..." : "search by title...";
  const discoverPrompts = SEARCH_DISCOVER_PROMPTS[type === "MANGA" ? "MANGA" : "ANIME"];

  // Browse keyword-only search uses the local DB for instant results. When filters are
  // active, show local matches until the URL and server round-trip catch up.
  const trimmedQuery = query.trim();
  const isQueryOnlyBrowse = tab === "browse" && activeFilterCount === 0;
  const queryAwaitingServer =
    trimmedQuery.length >= 2 && (trimmedQuery !== str(params.q) || isPending);
  const showClientTitleResults =
    tab === "browse" &&
    trimmedQuery.length >= 2 &&
    titleResults.length > 0 &&
    (isQueryOnlyBrowse || queryAwaitingServer);
  const showClientTitleLoading =
    tab === "browse" &&
    trimmedQuery.length >= 2 &&
    isQueryOnlyBrowse &&
    (titlesLoading || (trimmedQuery !== str(params.q) && !titleResults.length));
  const showClientTitleEmpty =
    tab === "browse" &&
    trimmedQuery.length >= 2 &&
    isQueryOnlyBrowse &&
    !titlesLoading &&
    titleResults.length === 0;

  return (
    <>
      <div className="flex flex-col items-center w-full mb-8">
        <div className="w-full" style={{ maxWidth: 680 }}>

          {/* Input with attached submit button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 48,
              paddingRight: 8,
              background: "var(--bg-elevated)",
              border: `1px solid ${focused ? "#3a3a3d" : "var(--bg-card-high)"}`,
              borderRadius: 2,
              marginBottom: 16,
              transition: "border-color 0.15s ease",
            }}
          >
            {tab === "ai" && (
              <span
                style={{
                  paddingLeft: 14,
                  fontSize: 13,
                  color: "var(--primary)",
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                ✦
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              className="outline-none search-input"
              style={{
                flex: 1,
                alignSelf: "stretch",
                minWidth: 0,
                border: "none",
                background: "transparent",
                color: "var(--fg)",
                fontFamily: "var(--font-space-mono)",
                fontSize: 13,
                letterSpacing: "0.04em",
                padding: tab === "ai" ? "0 16px 0 8px" : "0 16px 0 14px",
              }}
            />
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                flexShrink: 0,
                marginRight: 10,
                borderRadius: "50%",
                border: "1.5px solid var(--bg-card-high)",
                borderTopColor: "var(--primary)",
                opacity: isPending ? 1 : 0,
                transition: "opacity 0.15s ease",
                animation: isPending ? "search-spin 0.6s linear infinite" : "none",
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: "var(--primary)",
                border: "none",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: "#fff" }} />
            </button>
          </div>

          {/* 3. Mode tabs — flat underline style */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
            <FlatTab label="BROWSE" active={tab === "browse"} onClick={() => handleTabChange("browse")} flushStart />
            <FlatTab label="DISCOVER" active={tab === "ai"} onClick={() => handleTabChange("ai")} />
          </div>

          {/* 4a. DISCOVER: type toggle + hint + prompt chips when no submitted query */}
          {tab === "ai" && (
            <div>
              {/* ANIME / MANGA toggle — same flat tab style */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                <FlatTab label="ANIME" active={type === "ANIME"} onClick={() => navigate({ type: "ANIME" })} flushStart />
                <FlatTab label="MANGA" active={type === "MANGA"} onClick={() => navigate({ type: "MANGA" })} />
              </div>

              {!hasBrowseQuery && (
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      color: "var(--fg-muted)",
                      marginBottom: 12,
                    }}
                  >
                    WHAT ARE YOU IN THE MOOD FOR?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {discoverPrompts.map((entry) => (
                      <PromptChip
                        key={entry.label}
                        label={entry.label}
                        onClick={() => handleChipClick(entry.searchQuery ?? entry.label)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4b. BROWSE: type toggle + filter dropdowns */}
          {tab === "browse" && (
            <div>
              {/* ANIME / MANGA toggle — same flat tab style */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                <FlatTab label="ANIME" active={type === "ANIME"} onClick={() => navigate({ type: "ANIME" })} flushStart />
                <FlatTab label="MANGA" active={type === "MANGA"} onClick={() => navigate({ type: "MANGA" })} />
              </div>

              {/* Filter dropdowns */}
              <div className="flex flex-wrap gap-2 mb-6">
                <FilterSelect
                  value={genre}
                  onChange={(v) => navigate({ genre: v || undefined })}
                  placeholder="GENRE"
                  options={GENRES.map((g) => ({ value: g, label: g.toUpperCase() }))}
                  active={!!genre}
                />
                <FilterSelect
                  value={sort}
                  onChange={(v) => navigate({ sort: v || undefined })}
                  placeholder="SORT"
                  options={SORTS}
                  active={!!sort}
                />
                <FilterSelect
                  value={status}
                  onChange={(v) => navigate({ status: v || undefined })}
                  placeholder="STATUS"
                  options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                  active={!!status}
                />
                <FilterSelect
                  value={season}
                  onChange={(v) => navigate({ season: v || undefined })}
                  placeholder="SEASON"
                  options={SEASONS.map((s) => ({ value: s, label: s }))}
                  active={!!season}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <FilterSelect
                    value={year}
                    onChange={(v) => navigate({ year: v || undefined })}
                    placeholder="YEAR"
                    options={YEARS.map((y) => ({ value: y, label: y }))}
                    active={!!year}
                  />
                  {(activeFilterCount > 0 || hasBrowseQuery) && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      aria-label="Clear filters"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        background: "transparent",
                        color: "var(--fg-muted)",
                        border: "1px solid var(--bg-card-high)",
                        borderRadius: 2,
                        cursor: "pointer",
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Empty state: no filters, no keyword */}
              {activeFilterCount === 0 && !hasBrowseQuery && (
                <StatusMessage block style={{ padding: "32px 0" }}>
                  Select a filter or type to browse.
                </StatusMessage>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results — full page-container width */}
      <div style={{ position: "relative" }}>
        {isPending && hasBrowseQuery && activeFilterCount > 0 && !showClientTitleResults && (
          <StatusNotice pulse style={{ marginBottom: 12 }}>
            Searching…
          </StatusNotice>
        )}
        {showClientTitleResults ? (
          <div>
            <BrowseResultsLabel query={trimmedQuery} count={titleResults.length} />
            <div className={GRID}>
              {titleResults.map((r) => (
                <AnimeCard key={r.id} anime={titleResultToCard(r)} size="md" />
              ))}
            </div>
          </div>
        ) : showClientTitleLoading ? (
          <SearchSkeletonGrid />
        ) : showClientTitleEmpty ? (
          <StatusMessage block style={{ padding: "48px 0", textAlign: "center" }}>
            No results.
          </StatusMessage>
        ) : (
          <>
            <div style={{ opacity: isPending && hadResultsBefore ? 0.5 : 1, transition: "opacity 0.15s ease" }}>
              {children}
            </div>
            {isPending && !hadResultsBefore && <SearchSkeletonGrid />}
          </>
        )}
      </div>
    </>
  );
}

function BrowseResultsLabel({ query, count }: { query: string; count: number }) {
  const truncated = query.length > 30 ? `${query.slice(0, 30)}…` : query;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 8px 0", marginTop: 4 }}>
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          letterSpacing: "0.08em",
          color: "var(--fg-subtle)",
          textTransform: "uppercase",
        }}
      >
        {`RESULTS FOR "${truncated.toUpperCase()}"`}
      </span>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-faint)" }}>
        {count} found
      </span>
    </div>
  );
}

function FlatTab({
  label,
  active,
  onClick,
  flushStart = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  flushStart?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: flushStart ? "8px 16px 8px 0" : "8px 16px",
        marginBottom: -1,
        background: "transparent",
        border: "none",
        borderBottom: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
        color: active ? "var(--primary)" : "var(--fg-muted)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.15s ease, border-color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function PromptChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 11,
        letterSpacing: "0.04em",
        color: hovered ? "var(--fg)" : "var(--fg-muted)",
        background: "var(--bg-elevated)",
        border: `1px ${hovered ? "solid" : "dashed"} var(--bg-card-high)`,
        borderRadius: 2,
        padding: "6px 12px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
