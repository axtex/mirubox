"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, LayoutGrid, ChevronDown } from "lucide-react";
import { TABS } from "./types";
import { ListRow } from "./ListRow";
import { GridCard } from "./GridCard";
import type { EntryData, WatchlistStatus, SortKey } from "./types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",  label: "RECENTLY ADDED ↓" },
  { value: "rating",  label: "RATING (HIGH–LOW)" },
  { value: "title",   label: "TITLE A–Z" },
  { value: "release", label: "RELEASE DATE" },
];

interface Props {
  entries: EntryData[];
  counts: Record<string, number>;
  activeTab: WatchlistStatus;
  sort: SortKey;
  baseUrl?: string;
}

export function TrackerClient({ entries, counts, activeTab, sort, baseUrl = "/watchlist" }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");
  const [localEntries, setLocalEntries] = useState(entries);

  // Sync when server re-renders with new data (tab/sort change)
  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  // Load view preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mirubox-tracker-view");
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function toggleView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("mirubox-tracker-view", v);
  }

  function buildHref(tab: WatchlistStatus, s: SortKey): string {
    const url = new URL(baseUrl, "http://x");
    if (tab !== "ALL") url.searchParams.set("status", tab);
    else url.searchParams.delete("status");
    if (s !== "recent") url.searchParams.set("sort", s);
    else url.searchParams.delete("sort");
    return url.pathname + (url.search || "");
  }

  function handleEntryUpdate(animeId: number, updates: Partial<EntryData>) {
    setLocalEntries((prev) => {
      const next = prev.map((e) => (e.animeId === animeId ? { ...e, ...updates } : e));
      // Remove from filtered view if status no longer matches the active tab
      if (activeTab !== "ALL" && "status" in updates && updates.status !== activeTab) {
        return next.filter((e) => e.animeId !== animeId);
      }
      return next;
    });
  }

  function handleEntryRemove(animeId: number) {
    setLocalEntries((prev) => prev.filter((e) => e.animeId !== animeId));
  }

  const watchingCount  = counts["WATCHING"]      ?? 0;
  const completedCount = counts["COMPLETED"]     ?? 0;
  const planCount      = counts["PLAN_TO_WATCH"] ?? 0;
  const totalCount     = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-6">
        <div>
          <h1 className="text-headline-lg font-display uppercase">TRACKER</h1>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              marginTop: 4,
            }}
          >
            {watchingCount} Watching · {completedCount} Completed · {planCount} Plan to Watch
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:mt-1 ml-auto">
          <SortSelect
            value={sort}
            onChange={(s) => router.push(buildHref(activeTab, s))}
          />

          {/* View toggle */}
          <button
            onClick={() => toggleView("list")}
            title="List view"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              border: "1px solid var(--border)",
              background: view === "list" ? "var(--primary)" : "var(--bg-card)",
              color: view === "list" ? "#fff" : "var(--fg-subtle)",
              cursor: "pointer",
            }}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleView("grid")}
            title="Grid view"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              border: "1px solid var(--border)",
              background: view === "grid" ? "var(--primary)" : "var(--bg-card)",
              color: view === "grid" ? "#fff" : "var(--fg-subtle)",
              cursor: "pointer",
            }}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap mb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map(({ value, label }, index) => {
          const count = value === "ALL" ? totalCount : (counts[value] ?? 0);
          const active = activeTab === value;
          return (
            <Link
              key={value}
              href={buildHref(value, sort)}
              className="flex items-center gap-2 py-2.5 transition-colors"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: index === 0 ? "10px 16px 10px 0" : "10px 16px",
                color: active ? "var(--primary)" : "var(--fg-muted)",
                borderBottom: active
                  ? "1.5px solid var(--primary)"
                  : "1.5px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {label}
              {count > 0 && (
                <span style={{ color: "var(--fg-subtle)", fontSize: 10 }}>{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {localEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          {activeTab === "ALL" ? (
            <>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                Your tracker is empty. Start adding anime →
              </p>
              <Link href="/" className="btn-primary" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
                BROWSE ANIME
              </Link>
            </>
          ) : (
            <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
              Nothing here yet.
            </p>
          )}
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────── */}
      {view === "list" && localEntries.length > 0 && (
        <div
          className="flex flex-col relative"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {localEntries.map((entry) => (
            <ListRow
              key={entry.animeId}
              entry={entry}
              onUpdate={handleEntryUpdate}
              onRemove={handleEntryRemove}
            />
          ))}
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────────── */}
      {view === "grid" && localEntries.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 [&>*]:min-w-0">
          {localEntries.map((entry) => (
            <GridCard key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}
    </>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: SortKey) => void;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="outline-none cursor-pointer appearance-none"
        style={{
          height: 32,
          paddingLeft: 10,
          paddingRight: 28,
          background: "var(--bg-elevated)",
          color: "var(--fg-muted)",
          border: "1px solid var(--bg-card-high)",
          borderRadius: 2,
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
        }}
      >
        {SORT_OPTIONS.map((o) => (
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
          color: "var(--fg-subtle)",
        }}
      />
    </div>
  );
}
