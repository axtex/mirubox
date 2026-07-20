"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { useRouter } from "next/navigation";
import { ChevronRight, List, LayoutGrid, Download } from "lucide-react";
import { FilterSelect } from "@/components/FilterSelect";
import { AnimeCardActions } from "@/components/anime/AnimeCardActions";
import { STATUS_TABS, TYPE_TABS, statusToSlug } from "@/app/tracker/types";
import { ListRow } from "@/app/tracker/ListRow";
import { GridCard } from "@/app/tracker/GridCard";
import type { EntryData, TrackerStatus, MediaType, SortKey, MediaCounts } from "@/app/tracker/types";
import { StatusMessage } from "@/components/ui/StatusMessage";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "MOST RECENT ↓" },
  { value: "rating", label: "RATING (HIGH–LOW)" },
  { value: "title",  label: "TITLE A–Z" },
];

interface Props {
  entries: EntryData[];
  /** counts[status] = count, scoped to current mediaType filter */
  counts: Record<string, number>;
  /** Optional per-type status counts for instant client filters */
  countsByType?: Record<"ALL" | "ANIME" | "MANGA", Record<string, number>>;
  mediaCounts: MediaCounts;
  mediaType: MediaType;
  activeStatus: TrackerStatus;
  sort: SortKey;
  baseUrl?: string;
  showFavourites?: boolean;
  favouriteCount?: number;
}

function sortEntries(list: EntryData[], sort: SortKey): EntryData[] {
  const next = [...list];
  if (sort === "rating") {
    next.sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0));
  } else if (sort === "title") {
    next.sort((a, b) =>
      (a.anime.titleEnglish ?? a.anime.title).localeCompare(b.anime.titleEnglish ?? b.anime.title),
    );
  } else {
    next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return next;
}

export function TrackerList({
  entries,
  counts: countsProp,
  mediaCounts,
  mediaType: initialMediaType,
  activeStatus: initialStatus,
  sort: initialSort,
  baseUrl = "/tracker",
  showFavourites = false,
  favouriteCount = 0,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");
  const [library, setLibrary] = useState(entries);
  const [filterType, setFilterType] = useState<MediaType>(initialMediaType);
  const [filterStatus, setFilterStatus] = useState<TrackerStatus>(initialStatus);
  const [filterSort, setFilterSort] = useState<SortKey>(initialSort);

  useEffect(() => { setLibrary(entries); }, [entries]);
  useEffect(() => { setFilterType(initialMediaType); }, [initialMediaType]);
  useEffect(() => { setFilterStatus(initialStatus); }, [initialStatus]);
  useEffect(() => { setFilterSort(initialSort); }, [initialSort]);

  useEffect(() => {
    const stored = localStorage.getItem("mirubox-tracker-view");
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function toggleView(v: "list" | "grid") {
    setView(v);
    localStorage.setItem("mirubox-tracker-view", v);
  }

  function buildHref(type: MediaType, status: TrackerStatus, s: SortKey): string {
    const url = new URL(baseUrl, "http://x");
    if (type !== "ALL") url.searchParams.set("type", type.toLowerCase());
    else url.searchParams.delete("type");
    if (status !== "ALL") url.searchParams.set("status", statusToSlug(status));
    else url.searchParams.delete("status");
    if (s !== "recent") url.searchParams.set("sort", s);
    else url.searchParams.delete("sort");
    return url.pathname + (url.search || "");
  }

  function buildFavouritesHref(s: SortKey): string {
    const url = new URL(baseUrl, "http://x");
    url.searchParams.set("favourites", "true");
    if (s !== "recent") url.searchParams.set("sort", s);
    return url.pathname + (url.search || "");
  }

  /** Update filters without a server round-trip (URL stays shareable). */
  function applyFilters(type: MediaType, status: TrackerStatus, s: SortKey): void {
    setFilterType(type);
    setFilterStatus(status);
    setFilterSort(s);
    window.history.replaceState(null, "", buildHref(type, status, s));
  }

  function handleEntryUpdate(animeId: number, updates: Partial<EntryData>) {
    setLibrary((prev) =>
      prev.map((e) => {
        if (e.animeId !== animeId) return e;
        const next = { ...e, ...updates };
        // Status/progress bumps updatedAt so Most Recent sort puts the title on top.
        const statusChanged = updates.status !== undefined && updates.status !== e.status;
        const progressChanged = updates.progress !== undefined && updates.progress !== e.progress;
        if (statusChanged || progressChanged) {
          next.updatedAt = new Date().toISOString();
        }
        return next;
      }),
    );
  }

  function handleEntryRemove(animeId: number) {
    setLibrary((prev) => prev.filter((e) => e.animeId !== animeId));
  }

  function handleFavouriteChange(animeId: number, isFavourite: boolean) {
    if (!isFavourite) handleEntryRemove(animeId);
  }

  function handleFavouriteOnlyTrack(animeId: number, status: string) {
    handleEntryUpdate(animeId, { isFavouriteOnly: false, status });
  }

  const mediaType = showFavourites ? "ALL" : filterType;
  const activeStatus = showFavourites ? "ALL" : filterStatus;
  const sort = filterSort;

  // Derive tab counts from live library so status changes update immediately.
  const counts = useMemo(() => {
    if (showFavourites) return countsProp;
    const scoped =
      filterType === "ALL"
        ? library
        : library.filter((e) => e.mediaType === filterType);
    const result: Record<string, number> = {};
    for (const e of scoped) {
      if (e.isFavouriteOnly) continue;
      result[e.status] = (result[e.status] ?? 0) + 1;
    }
    return result;
  }, [library, filterType, showFavourites, countsProp]);

  const localEntries = useMemo(() => {
    if (showFavourites) return sortEntries(library, sort);
    let next = library;
    if (filterType !== "ALL") {
      next = next.filter((e) => e.mediaType === filterType);
    }
    if (filterStatus !== "ALL") {
      next = next.filter((e) => e.status === filterStatus);
    }
    return sortEntries(next, sort);
  }, [library, showFavourites, filterType, filterStatus, sort]);

  const totalStatus = Object.values(counts).reduce((a, b) => a + b, 0);

  const subtitle = showFavourites
    ? `${mediaCounts.total} title${mediaCounts.total !== 1 ? "s" : ""} favourited`
    : mediaType === "ALL"
    ? `${mediaCounts.anime} Anime · ${mediaCounts.manga} Manga`
    : mediaType === "ANIME"
    ? `${mediaCounts.anime} titles`
    : `${mediaCounts.manga} titles`;

  // In favourites view, separate tracked vs favourite-only entries
  const trackedEntries = localEntries.filter((e) => !e.isFavouriteOnly);
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
          <FilterSelect
            value={sort}
            onChange={(s) => {
              const next = s as SortKey;
              if (showFavourites) {
                router.push(buildFavouritesHref(next));
              } else {
                applyFilters(filterType, filterStatus, next);
              }
            }}
            options={SORT_OPTIONS}
            active={sort !== "recent"}
            variant="control"
          />
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
          <button
            type="button"
            onClick={() => router.push("/import")}
            title="Import from AniList or MAL"
            style={viewBtnStyle(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-subtle)";
            }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Type pills ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-5">
        {TYPE_TABS.map(({ value, label }) => {
          const count =
            value === "ALL"
              ? mediaCounts.total
              : value === "ANIME"
              ? mediaCounts.anime
              : mediaCounts.manga;
          const active = !showFavourites && mediaType === value;
          const pillStyle = {
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
            cursor: "pointer",
          } as const;

          if (showFavourites) {
            return (
              <Link key={value} href={buildHref(value, "ALL", sort)} style={pillStyle}>
                {label}
                <span style={{ fontSize: 9, opacity: 0.6 }}>{count}</span>
              </Link>
            );
          }

          return (
            <button
              key={value}
              type="button"
              onClick={() => applyFilters(value, filterStatus, filterSort)}
              style={pillStyle}
            >
              {label}
              <span style={{ fontSize: 9, opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
        <Link
          href={buildFavouritesHref(sort)}
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            padding: "5px 14px",
            borderRadius: 2,
            background: showFavourites ? "var(--primary)" : "var(--bg-elevated)",
            color: showFavourites ? "#fff" : "var(--fg-muted)",
            border: showFavourites ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          FAVS
          <span style={{ fontSize: 9, opacity: 0.6 }}>{favouriteCount}</span>
        </Link>
      </div>

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
              <button
                key={value}
                type="button"
                onClick={() => applyFilters(filterType, value, filterSort)}
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
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  cursor: "pointer",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ color: "var(--fg-subtle)", fontSize: 9 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Favourites view: empty state ────────────────────────────────── */}
      {showFavourites && localEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <StatusMessage block variant="muted">No favourites yet.</StatusMessage>
          <StatusMessage block style={{ fontSize: 10, letterSpacing: "0.04em" }}>
            Tap the heart icon on any title to save it here.
          </StatusMessage>
        </div>
      )}

      {/* ── Normal empty state ───────────────────────────────────────────── */}
      {!showFavourites && localEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          {activeStatus !== "ALL" ? (
            <StatusMessage block variant="muted">Nothing here.</StatusMessage>
          ) : mediaType === "ANIME" ? (
            <>
              <StatusMessage block variant="muted">No anime tracked yet.</StatusMessage>
              <Link href="/" className="btn-primary inline-flex items-center gap-1.5" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
                BROWSE ANIME
                <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              </Link>
            </>
          ) : mediaType === "MANGA" ? (
            <>
              <StatusMessage block variant="muted">No manga tracked yet.</StatusMessage>
              <Link href="/manga" className="btn-primary inline-flex items-center gap-1.5" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
                BROWSE MANGA
                <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              </Link>
            </>
          ) : (
            <>
              <StatusMessage block variant="muted">Your tracker is empty.</StatusMessage>
              <StatusMessage block style={{ fontSize: 10, letterSpacing: "0.04em" }}>
                Add anime and manga from their detail pages.
              </StatusMessage>
            </>
          )}
        </div>
      )}

      {/* ── Favourites view: list ────────────────────────────────────────── */}
      {showFavourites && localEntries.length > 0 && view === "list" && (
        <div className="flex flex-col relative" style={{ borderTop: "1px solid var(--border)" }}>
          {trackedEntries.map((entry) => (
            <ListRow
              key={entry.animeId}
              entry={entry}
              onUpdate={handleEntryUpdate}
              onRemove={handleEntryRemove}
              onFavouriteChange={handleFavouriteChange}
            />
          ))}
          {favouriteOnlyEntries.map((entry) => (
            <FavouriteOnlyRow
              key={entry.animeId}
              entry={entry}
              onTrack={handleFavouriteOnlyTrack}
              onUnfavourite={handleFavouriteChange}
            />
          ))}
        </div>
      )}

      {/* ── Favourites view: grid ────────────────────────────────────────── */}
      {showFavourites && localEntries.length > 0 && view === "grid" && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
          {trackedEntries.map((entry) => (
            <GridCard
              key={entry.animeId}
              entry={entry}
              onUpdate={handleEntryUpdate}
              onRemove={handleEntryRemove}
              onFavouriteChange={handleFavouriteChange}
            />
          ))}
          {favouriteOnlyEntries.map((entry) => (
            <FavouriteOnlyCard
              key={entry.animeId}
              entry={entry}
              onTrack={handleFavouriteOnlyTrack}
              onUnfavourite={handleFavouriteChange}
            />
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
              onFavouriteChange={showFavourites ? handleFavouriteChange : undefined}
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
              onFavouriteChange={showFavourites ? handleFavouriteChange : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FavouriteOnlyRow({
  entry,
  onTrack,
  onUnfavourite,
}: {
  entry: EntryData;
  onTrack: (animeId: number, status: string) => void;
  onUnfavourite: (animeId: number, isFavourite: boolean) => void;
}) {
  const title = entry.anime.titleEnglish ?? entry.anime.title;
  const href = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;

  return (
    <div
      className="group flex items-center gap-3 py-2 pr-5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <Link href={href} className="shrink-0">
        <div className="relative overflow-hidden" style={{ width: 40, height: 56, borderRadius: 2 }}>
          {entry.anime.coverImage ? (
            <ImageWithFallback src={entry.anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
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
      <div className="shrink-0" style={{ width: 92 }}>
        <AnimeCardActions
          mediaId={entry.animeId}
          mediaType={entry.mediaType}
          iconSize="sm"
          opaque
          onTrackerChange={(status) => { if (status) onTrack(entry.animeId, status); }}
          onFavouriteChange={(isFavourite) => onUnfavourite(entry.animeId, isFavourite)}
        />
      </div>
    </div>
  );
}

function FavouriteOnlyCard({
  entry,
  onTrack,
  onUnfavourite,
}: {
  entry: EntryData;
  onTrack: (animeId: number, status: string) => void;
  onUnfavourite: (animeId: number, isFavourite: boolean) => void;
}) {
  const title = entry.anime.titleEnglish ?? entry.anime.title;
  const href = entry.mediaType === "MANGA" ? `/manga/${entry.animeId}` : `/anime/${entry.animeId}`;

  return (
    <div
      className="anime-card group relative min-w-0"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {entry.anime.coverImage ? (
          <ImageWithFallback
            src={entry.anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 15vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}
        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`View ${title}`} />
        <div
          className="absolute bottom-0 left-0 right-0 z-[3]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            padding: "20px 7px 7px",
          }}
        >
          <AnimeCardActions
            mediaId={entry.animeId}
            mediaType={entry.mediaType}
            iconSize="sm"
            opaque
            onTrackerChange={(status) => { if (status) onTrack(entry.animeId, status); }}
            onFavouriteChange={(isFavourite) => onUnfavourite(entry.animeId, isFavourite)}
          />
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
