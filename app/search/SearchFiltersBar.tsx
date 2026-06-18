"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "cozy slice of life with magic",
  "psychological thriller with a twist ending",
  "found family in a fantasy world",
  "dark action with moral ambiguity",
  "enemies to lovers slow burn",
  "action with breathtaking animation",
];

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const FORMATS_ANIME = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"];
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED"];
const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i));

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

  const tab = str(params.tab) || "ai";
  const [query, setQuery] = useState(str(params.q));
  const [focused, setFocused] = useState(false);

  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);
  const activeFilterCount = [genre, status, format, year].filter(Boolean).length;

  function buildHref(overrides: Record<string, string | undefined>): string {
    const current: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) current[k] = String(v);
    });
    const merged: Record<string, string | undefined> = { ...current, ...overrides };
    const next: Record<string, string> = {};
    Object.keys(merged).forEach((k) => {
      if (merged[k] && k !== "page") next[k] = merged[k] as string;
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
    });
  }

  function handleSubmit(): void {
    const q = query.trim();
    if (q) navigate({ q, tab: "ai" });
  }

  function handleChipClick(prompt: string): void {
    setQuery(prompt);
    navigate({ q: prompt, tab: "ai" });
  }

  return (
    <div className="flex flex-col items-center w-full mb-8">
      <div className="w-full" style={{ maxWidth: 700 }}>

        {/* AI SEARCH label */}
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--fg-subtle)",
            marginBottom: 10,
          }}
        >
          ✦ SEMANTIC SEARCH
        </p>

        {/* Large search input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="dark fantasy with a slow burn romance..."
            className="w-full outline-none transition-all"
            style={{
              height: 64,
              paddingLeft: 20,
              paddingRight: 56,
              background: "var(--bg-card)",
              border: `1.5px solid ${focused ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 2,
              color: "var(--fg)",
              fontFamily: "var(--font-space-mono)",
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              background: "var(--primary)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Search className="w-4 h-4" style={{ color: "#fff" }} />
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-2">
          <TabPill label="✦ AI SEARCH" active={tab === "ai"} onClick={() => handleTabChange("ai")} />
          <TabPill label="BROWSE" active={tab === "browse"} onClick={() => handleTabChange("browse")} />
        </div>

        {/* Descriptor */}
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--fg-muted)",
            marginBottom: 24,
          }}
        >
          {tab === "ai"
            ? "Describe what you're in the mood for. We'll find it."
            : "Filter by genre, format, year, or status."}
        </p>

        {/* BROWSE: filter row */}
        {tab === "browse" && (
          <div className="flex flex-wrap gap-2">
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
            {activeFilterCount > 0 && (
              <button
                onClick={() => navigate({ genre: undefined, status: undefined, format: undefined, year: undefined })}
                style={{
                  flexShrink: 0,
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  padding: "6px 12px",
                  background: "transparent",
                  color: "var(--score-low)",
                  border: "1px solid var(--score-low)",
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              >
                CLEAR {activeFilterCount}×
              </button>
            )}
          </div>
        )}

        {/* AI SEARCH: example prompt chips when no active query */}
        {tab === "ai" && !str(params.q) && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleChipClick(prompt)}
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.05em",
                  color: "var(--fg-muted)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: "6px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-bright)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)";
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "6px 16px",
        background: active ? "var(--primary)" : "var(--bg-card)",
        color: active ? "#fff" : "var(--fg-muted)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 999,
        cursor: "pointer",
        transition: "all 0.15s ease",
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="outline-none cursor-pointer appearance-none"
      style={{
        flexShrink: 0,
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        letterSpacing: "0.06em",
        padding: "6px 16px",
        minWidth: `calc(${placeholder.length}ch + 2rem)`,
        background: active ? "var(--primary)" : "var(--bg-card)",
        color: active ? "#fff" : "var(--fg-muted)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 2,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
