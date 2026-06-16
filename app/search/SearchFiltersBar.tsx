"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import { Search } from "lucide-react";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);

  const [query, setQuery] = useState(str(params.q));
  const type = str(params.type) || "ANIME";
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v ?? "")])),
      ...overrides,
    };
    Object.keys(next).forEach((k) => { if (!next[k]) delete next[k]; });
    delete next.page;
    return `${pathname}?${new URLSearchParams(next as Record<string, string>)}`;
  }

  function navigate(overrides: Record<string, string | undefined>) {
    startTransition(() => router.push(buildHref(overrides)));
  }

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        navigate({ q: value || undefined });
      }, 400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params]
  );

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const activeFilterCount = [genre, status, format, year].filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Large search input */}
      <div className="relative mb-4">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          style={{ color: focused ? "var(--primary)" : "var(--fg-muted)" }}
        />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="SEARCH ANIME, MANGA, GENRES…"
          className="w-full pl-12 pr-16 outline-none transition-all"
          style={{
            height: 56,
            background: "var(--bg-card)",
            border: `1px solid ${focused ? "var(--primary)" : "var(--border)"}`,
            borderRadius: 2,
            color: "var(--fg)",
            fontFamily: "var(--font-space-mono)",
            fontSize: 12,
            letterSpacing: "0.08em",
          }}
        />
        <kbd
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--fg-subtle)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-space-mono)",
            borderRadius: 2,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Filter bar */}
      <div className="flex scroll-row gap-2">
        {/* Type toggle */}
        {(["ANIME", "MANGA"] as const).map((t) => (
          <button
            key={t}
            onClick={() => navigate({ type: t })}
            className="shrink-0 text-label px-3 py-1.5 transition-all"
            style={{
              background: type === t ? "var(--primary)" : "var(--bg-card)",
              color: type === t ? "#fff" : "var(--fg-muted)",
              border: `1px solid ${type === t ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 2,
            }}
          >
            {t}
          </button>
        ))}

        <div className="w-px shrink-0 self-stretch" style={{ background: "var(--border)" }} />

        {/* Genre */}
        <FilterSelect
          value={genre}
          onChange={(v) => navigate({ genre: v || undefined })}
          placeholder="GENRE"
          options={GENRES.map((g) => ({ value: g, label: g.toUpperCase() }))}
          active={!!genre}
        />

        {/* Status */}
        <FilterSelect
          value={status}
          onChange={(v) => navigate({ status: v || undefined })}
          placeholder="STATUS"
          options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          active={!!status}
        />

        {/* Format */}
        <FilterSelect
          value={format}
          onChange={(v) => navigate({ format: v || undefined })}
          placeholder="FORMAT"
          options={FORMATS_ANIME.map((f) => ({ value: f, label: f }))}
          active={!!format}
        />

        {/* Year */}
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
            className="shrink-0 text-label px-3 py-1.5 transition-all"
            style={{
              background: "transparent",
              color: "var(--score-low)",
              border: "1px solid var(--score-low)",
              borderRadius: 2,
            }}
          >
            CLEAR {activeFilterCount}×
          </button>
        )}
      </div>
    </div>
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
      className="shrink-0 text-label px-3 py-1.5 outline-none cursor-pointer appearance-none"
      style={{
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
