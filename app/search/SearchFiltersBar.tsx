"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { useRef, useEffect } from "react";

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

  const [query, setQuery] = useState(str(params.q));
  const type = str(params.type) || "ANIME";

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = { ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v ?? "")])), ...overrides };
    // Remove empty values
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
      }, 300);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params]
  );

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);

  return (
    <div className="mb-6">
      {/* Search input */}
      <div className="relative mb-4">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: "var(--fg-muted)" }}
        />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search anime, manga, characters…"
          className="w-full pl-12 pr-4 py-3 rounded-xl text-base outline-none transition-all"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
      </div>

      {/* Filter chips — horizontal scroll */}
      <div className="scroll-row gap-2">
        {/* Type */}
        {["ANIME", "MANGA"].map((t) => (
          <button
            key={t}
            onClick={() => navigate({ type: t })}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: type === t ? "var(--accent)" : "var(--bg-card)",
              color: type === t ? "#fff" : "var(--fg-muted)",
              border: `1px solid ${type === t ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {t}
          </button>
        ))}

        <div className="w-px shrink-0" style={{ background: "var(--border)" }} />

        {/* Genre */}
        <select
          value={genre}
          onChange={(e) => navigate({ genre: e.target.value || undefined })}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs outline-none cursor-pointer"
          style={{
            background: genre ? "var(--accent-muted)" : "var(--bg-card)",
            color: genre ? "var(--accent-bright)" : "var(--fg-muted)",
            border: `1px solid ${genre ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <option value="">Genre</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => navigate({ status: e.target.value || undefined })}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs outline-none cursor-pointer"
          style={{
            background: status ? "var(--accent-muted)" : "var(--bg-card)",
            color: status ? "var(--accent-bright)" : "var(--fg-muted)",
            border: `1px solid ${status ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <option value="">Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        {/* Format */}
        <select
          value={format}
          onChange={(e) => navigate({ format: e.target.value || undefined })}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs outline-none cursor-pointer"
          style={{
            background: format ? "var(--accent-muted)" : "var(--bg-card)",
            color: format ? "var(--accent-bright)" : "var(--fg-muted)",
            border: `1px solid ${format ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <option value="">Format</option>
          {FORMATS_ANIME.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => navigate({ year: e.target.value || undefined })}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs outline-none cursor-pointer"
          style={{
            background: year ? "var(--accent-muted)" : "var(--bg-card)",
            color: year ? "var(--accent-bright)" : "var(--fg-muted)",
            border: `1px solid ${year ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <option value="">Year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
