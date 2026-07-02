"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, LayoutGrid, ChevronDown, Heart } from "lucide-react";
import { STATUS_TABS, TYPE_TABS, statusToSlug, slugToStatus } from "@/app/watchlist/types";
import { ListRow } from "@/app/watchlist/ListRow";
import { GridCard } from "@/app/watchlist/GridCard";
import type { EntryData, WatchlistStatus, MediaType, SortKey, MediaCounts } from "@/app/watchlist/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",  label: "RECENTLY ADDED ↓" },
  { value: "rating",  label: "RATING (HIGH–LOW)" },
  { value: "title",   label: "TITLE A–Z" },
  { value: "release", label: "RELEASE DATE" },
];

interface Props {
  entries: EntryData[];
  /** counts[status] = count, scoped to current mediaType filter */
  counts: Record<string, number>;
  mediaCounts: MediaCounts;
  mediaType: MediaType;
  activeStatus: WatchlistStatus;
  sort: SortKey;
  baseUrl?: string;
  showFavourites?: boolean;
}

export function TrackerList({
  entries,
  counts,
  mediaCounts,
  mediaType,
  activeStatus,
  sort,
  baseUrl = "/watchlist",
  showFavourites = false,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => { setLocalEntries(entries); }, [entries]);

  useEffect(() => {
    const stored = localStorage.getItem("mirubox-tracker-view");
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function toggleView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("mirubox-tracker-view", v);
  }

  function buildHref(type: MediaType, status: WatchlistStatus, s: SortKey): string {
    const url = new URL(baseUrl, "http://x");
    if (type !== "ALL") url.searchParams.set("type", type.toLowerCase());
    else url.searchParams.delete("type");
    if (status !== "ALL") url.searchParams.set("status", statusToSlug(status));
    else url.searchParams.delete("status");
    if (s !== "recent") url.searchParams.set("sort", s);
    else url.searchParams.delete("sort");
    return url.pathname + (url.search || "");
  }

  function buildFavouritesHref(on: boolean): string {
    const url = new URL(baseUrl, "http://x");
    if (on) url.searchParams.set("favourites", "true");
    if (sort !== "recent") url.searchParams.set("sort", sort);
    return url.pathname + (url.search || "");
  }

  function handleEntryUpdate(animeId: number, updates: Partial<EntryData>) {
    setLocalEntries((prev) => {
      const next = prev.map((e) => (e.animeId === animeId ? { ...e, ...updates } : e));
      if (activeStatus !== "ALL" && "status" in updates && updates.status !== activeStatus) {
        return next.filter((e) => e.animeId !== animeId);
      }
      return next;
    });
  }

  function handleEntryRemove(animeId: number) {
    setLocalEntries((prev) => prev.filter((e) => e.animeId !== animeId));
  }

  const totalStatus = Object.values(counts).reduce((a, b) => a + b, 0);

  const subtitle = showFavourites
    ? `${mediaCounts.total} title${mediaCounts.total !== 1 ? "s" : ""} favourited`
    : mediaType === "ALL"
    ? `${mediaCounts.anime} Anime · ${mediaCounts.manga} Manga`
    : mediaType === "ANIME"
    ? `${mediaCounts.anime} titles`
    : `${mediaCounts.manga} titles`;

  // In favourites view, separate archived vs favourite-only entries
  const archivedEntries = localEntries.filter((e) => !e.isFavouriteOnly);
  const favouriteOnlyEntries = localEntries.filter((e) => e.isFavouriteOnly);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-5">
        <div>
          <h1 className="text-headline-lg font-display uppercase">TRACKER</h1>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)", marginTop: 4 }}>
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:mt-1 ml-auto">
          <SortSelect value={sort} onChange={(s) => router.push(buildHref(mediaType, activeStatus, s))} />
          {/* ♥ Favourites toggle */}
          <Link
            href={buildFavouritesHref(!showFavourites)}
            title={showFavourites ? "Show all" : "Show favourites"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 32,
              padding: "0 10px",
              borderRadius: 2,
              border: showFavourites ? "1px solid #e8173f" : "1px solid #2a2a2d",
              background: showFavourites ? "rgba(232,23,63,0.1)" : "var(--bg-card)",
              color: showFavourites ? "#e8173f" : "#9e9ea8",
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.06em",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <Heart
              size={14}
              fill={showFavourites ? "#e8173f" : "none"}
              stroke={showFavourites ? "#e8173f" : "#9e9ea8"}
            />
            FAVOURITES
          </Link>
          <button
            onClick={() => toggleView("list")}
            title="List view"
            style={viewBtnStyle(view === "list")}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleView("grid")}
            title="Grid view"
            style={viewBtnStyle(view === "grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Type pills (hidden in favourites view) ─────────────────────── */}
      {!showFavourites && (
        <div className="flex gap-1.5 mb-5">
          {TYPE_TABS.map(({ value, label }) => {
            const count =
              value === "ALL"
                ? mediaCounts.total
                : value === "ANIME"
                ? mediaCounts.anime
                : mediaCounts.manga;
            const active = mediaType === value;
            return (
              <Link
                key={value}
                href={buildHref(value, activeStatus, sort)}
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  padding: "5px 14px",
                  borderRadius: 2,
                  background: active ? "var(--primary)" : "var(--bg-elevated)",
                  color: active ? "#fff" : "var(--fg-muted)",
                  border: active ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {label}
                <span style={{ fontSize: 9, opacity: 0.6 }}>{count}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Status sub-tabs (hidden in favourites view) ─────────────────── */}
      {!showFavourites && (
        <div
          className="flex flex-wrap mb-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {STATUS_TABS.map(({ value, label }, index) => {
            const count = value === "ALL" ? totalStatus : (counts[value] ?? 0);
            const active = activeStatus === value;
            return (
              <Link
                key={value}
                href={buildHref(mediaType, value, sort)}
                className="shrink-0 flex items-center gap-2 transition-colors"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  padding: index === 0 ? "10px 14px 10px 0" : "10px 14px",
                  color: active ? "var(--primary)" : "var(--fg-muted)",
                  borderBottom: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{count}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Favourites view: empty state ────────────────────────────────── */}
      {showFavourites && localEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
            No favourites yet.
          </p>
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
            Tap the heart icon on any title to save it here.
          </p>
        </div>
      )}

      {/* ── Normal empty state ───────────────────────────────────────────── */}
      {!showFavourites && localEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          {activeStatus !== "ALL" ? (
            <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
              Nothing here.
            </p>
          ) : mediaType === "ANIME" ? (
            <>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                No anime tracked yet.
              </p>
              <Link href="/" className="btn-primary" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
                BROWSE ANIME →
              </Link>
            </>
          ) : mediaType === "MANGA" ? (
            <>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                No manga tracked yet.
              </p>
              <Link href="/manga" className="btn-primary" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
                BROWSE MANGA →
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                Your tracker is empty.
              </p>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)" }}>
                Add anime and manga from their detail pages.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Favourites view: list ────────────────────────────────────────── */}
      {showFavourites && localEntries.length > 0 && view === "list" && (
        <div className="flex flex-col relative" style={{ borderTop: "1px solid var(--border)" }}>
          {archivedEntries.map((entry) => (
            <ListRow key={entry.animeId} entry={entry} onUpdate={handleEntryUpdate} onRemove={handleEntryRemove} />
          ))}
          {favouriteOnlyEntries.map((entry) => (
            <FavouriteOnlyRow key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}

      {/* ── Favourites view: grid ────────────────────────────────────────── */}
      {showFavourites && localEntries.length > 0 && view === "grid" && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
          {archivedEntries.map((entry) => (
            <GridCard key={entry.animeId} entry={entry} onUpdate={handleEntryUpdate} onRemove={handleEntryRemove} />
          ))}
          {favouriteOnlyEntries.map((entry) => (
            <FavouriteOnlyCard key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}

      {/* ── Normal list view ─────────────────────────────────────────────── */}
      {!showFavourites && view === "list" && localEntries.length > 0 && (
        <div className="flex flex-col relative" style={{ borderTop: "1px solid var(--border)" }}>
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

      {/* ── Normal grid view ─────────────────────────────────────────────── */}
      {!showFavourites && view === "grid" && localEntries.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
          {localEntries.map((entry) => (
            <GridCard
              key={entry.animeId}
              entry={entry}
              onUpdate={handleEntryUpdate}
              onRemove={handleEntryRemove}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FavouriteOnlyRow({ entry }: { entry: EntryData }) {
  const title = entry.anime.titleEnglish ?? entry.anime.title;
  const href = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;

  return (
    <div
      className="flex items-center gap-3 py-2 pr-5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <Link href={href} className="shrink-0">
        <div className="relative overflow-hidden" style={{ width: 40, height: 56, borderRadius: 2 }}>
          {entry.anime.coverImage ? (
            <Image src={entry.anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={href} style={{ textDecoration: "none" }}>
          <p className="truncate" style={{ fontSize: 13, color: "#e4e1e6", fontWeight: 500 }}>
            {title}
          </p>
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-subtle)", marginTop: 2 }}>
          NOT ARCHIVED
        </p>
      </div>
      <Heart size={12} fill="#e8173f" stroke="none" style={{ flexShrink: 0, opacity: 0.7 }} />
    </div>
  );
}

function FavouriteOnlyCard({ entry }: { entry: EntryData }) {
  const title = entry.anime.titleEnglish ?? entry.anime.title;
  const href = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;

  return (
    <div
      className="relative min-w-0"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {entry.anime.coverImage ? (
          <Image
            src={entry.anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 15vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}
        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`View ${title}`} />
        <div
          className="absolute bottom-1.5 right-1.5 z-[2] flex items-center justify-center"
          style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.55)" }}
        >
          <Heart size={9} fill="#e8173f" stroke="none" />
        </div>
      </div>
      <div style={{ padding: "6px 8px 8px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--fg)",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--fg-subtle)", marginTop: 3 }}>
          NOT ARCHIVED
        </p>
      </div>
    </div>
  );
}

function viewBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 2,
    border: "1px solid var(--border)",
    background: active ? "var(--primary)" : "var(--bg-card)",
    color: active ? "#fff" : "var(--fg-subtle)",
    cursor: "pointer",
  };
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
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
          border: "1px solid var(--bg-card-high, #2a2a2d)",
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
