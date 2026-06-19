"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "cozy witches",
  "found family in a broken world",
  "killers with a conscience",
  "psychological thriller with a twist",
  "slow burn that wrecks you",
  "brain rot but make it art",
];

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];
const FORMATS_ANIME = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"];
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED"];
const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i));
const SEASONS = ["SPRING", "SUMMER", "FALL", "WINTER"];
const SORTS = [
  { value: "TRENDING_DESC", label: "TRENDING" },
  { value: "SCORE_DESC", label: "TOP RATED" },
  { value: "POPULARITY_DESC", label: "POPULAR" },
];

interface SearchFiltersBarProps {
  params: Record<string, string | string[] | undefined>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export function SearchFiltersBar({ params }: SearchFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const tab = str(params.tab) || "ai";
  const [query, setQuery] = useState(str(params.q));
  const [focused, setFocused] = useState(false);

  const type = str(params.type) || "ANIME";
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);
  const season = str(params.season);
  const sort = str(params.sort);

  const activeFilterCount = [genre, status, format, year, season, sort].filter(Boolean).length;
  const hasBrowseQuery = !!str(params.q);

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
    const q = query.trim();
    if (!q) return;
    // In BROWSE tab: keyword search through AniList. In AI tab: semantic search.
    navigate({ q, tab: tab === "browse" ? "browse" : "ai" });
  }

  function handleChipClick(prompt: string): void {
    setQuery(prompt);
    navigate({ q: prompt, tab: "ai" });
  }

  function clearFilters(): void {
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

  return (
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
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="dark fantasy with a slow burn romance..."
            className="outline-none"
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
              padding: "0 16px",
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
          <FlatTab label="AI SEARCH" active={tab === "ai"} onClick={() => handleTabChange("ai")} flushStart />
          <FlatTab label="BROWSE" active={tab === "browse"} onClick={() => handleTabChange("browse")} />
        </div>

        {/* 4a. AI SEARCH: prompt chips when no query */}
        {tab === "ai" && !str(params.q) && (
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
              {EXAMPLE_PROMPTS.map((prompt) => (
                <PromptChip key={prompt} label={prompt} onClick={() => handleChipClick(prompt)} />
              ))}
            </div>
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
                value={sort}
                onChange={(v) => navigate({ sort: v || undefined })}
                placeholder="SORT"
                options={SORTS}
                active={!!sort}
              />
              <FilterSelect
                value={genre}
                onChange={(v) => navigate({ genre: v || undefined })}
                placeholder="GENRE"
                options={GENRES.map((g) => ({ value: g, label: g.toUpperCase() }))}
                active={!!genre}
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
              <FilterSelect
                value={format}
                onChange={(v) => navigate({ format: v || undefined })}
                placeholder="FORMAT"
                options={FORMATS_ANIME.map((f) => ({ value: f, label: f }))}
                active={!!format}
              />
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
                  style={{
                    flexShrink: 0,
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    padding: "0 10px",
                    height: 32,
                    background: "transparent",
                    color: "var(--score-low)",
                    border: "1px solid var(--score-low)",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Empty state: no filters, no keyword */}
            {activeFilterCount === 0 && !hasBrowseQuery && (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--fg-muted)",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                Select a filter or type a keyword to browse.
              </p>
            )}
          </div>
        )}
      </div>
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

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  active: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none cursor-pointer appearance-none"
        style={{
          height: 32,
          paddingLeft: 10,
          paddingRight: 28,
          background: active ? "var(--primary)" : "var(--bg-elevated)",
          color: active ? "#fff" : "var(--fg-muted)",
          border: `1px solid ${active ? "var(--primary)" : "var(--bg-card-high)"}`,
          borderRadius: 2,
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          width: 10,
          height: 10,
          color: active ? "#fff" : "var(--fg-subtle)",
        }}
      />
    </div>
  );
}
