"use client";

import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getDisplayTitle } from "@/lib/display-title";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import { AnimeCardActions } from "./AnimeCardActions";
import { useTracker, STATUS_COLORS, isTrackedEntry } from "@/lib/tracker-context";

interface AnimeCardProps {
  anime: AnimeCardType;
  size?: "sm" | "md" | "lg";
  /** Kept for backward compat — context is now the source of truth */
  trackerStatus?: string | null;
  userRating?: number | null;
  hideTitle?: boolean;
  /** When set, poster click selects instead of navigating; hides tracker actions */
  onSelect?: () => void;
  /** 1-based rank badge shown when selected in a picker */
  selectionRank?: number | null;
  selectDisabled?: boolean;
}

const IMAGE_SIZES = {
  sm: "100px",
  md: "(min-width: 768px) 15vw, 140px",
  lg: "(min-width: 768px) 20vw, 180px",
};

export function AnimeCard({
  anime,
  size = "md",
  hideTitle = false,
  onSelect,
  selectionRank = null,
  selectDisabled = false,
}: AnimeCardProps) {
  const { isLoggedIn, trackerMap } = useTracker();
  const selectMode = Boolean(onSelect);

  const entry = trackerMap.get(anime.id) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;
  const sc = status ? (STATUS_COLORS[status] ?? null) : null;
  const selected = selectionRank != null && selectionRank > 0;

  const title = getDisplayTitle(anime.title);
  const score = anime.averageScore;
  const detailHref = anime.type === "MANGA" ? `/manga/${anime.id}` : `/anime/${anime.id}`;

  return (
    <div
      tabIndex={selectMode ? -1 : 0}
      className={`anime-card anime-card--${size} group relative`}
      style={{
        borderRadius: 4,
        border: selected
          ? "1.5px solid var(--primary)"
          : sc
            ? `1px solid ${sc.border}`
            : "1px solid #1f1f22",
        transition: "border-color 0.2s ease",
        overflow: "hidden",
        opacity: selectDisabled ? 0.45 : 1,
      }}
    >
      {/* ── Poster ── */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        {anime.coverImage.extraLarge || anime.coverImage.large ? (
          <ImageWithFallback
            src={(anime.coverImage.extraLarge ?? anime.coverImage.large)!}
            alt={title}
            fill
            sizes={IMAGE_SIZES[size]}
            className="object-cover"
            style={{ transition: "none" }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "var(--bg-card)" }}
          >
            <span style={{ fontSize: 24, opacity: 0.15 }}>✦</span>
          </div>
        )}

        {selectMode ? (
          <button
            type="button"
            onClick={onSelect}
            disabled={selectDisabled}
            aria-pressed={selected}
            aria-label={
              selected ? `Remove ${title} from top 3` : `Add ${title} to top 3`
            }
            className="absolute inset-0 z-[1]"
            style={{
              cursor: selectDisabled ? "not-allowed" : "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          />
        ) : (
          <Link
            href={detailHref}
            prefetch
            className="absolute inset-0 z-[1]"
            aria-label={`View ${title}`}
          />
        )}

        {selected ? (
          <div
            className="absolute top-1.5 left-1.5 z-[2] pointer-events-none"
            style={{
              width: 20,
              height: 20,
              borderRadius: 2,
              background: "var(--primary)",
              color: "#fff",
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectionRank}
          </div>
        ) : null}

        {/* Score pill — top right, always visible */}
        {score !== null && (
          <div
            className="absolute top-1.5 right-1.5 z-[2] leading-none font-bold pointer-events-none"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 2,
              padding: "2px 5px",
            }}
          >
            {(score / 10).toFixed(1)}
          </div>
        )}

        {/* Desktop hover bar — gradient + action buttons, bottom of poster */}
        {/* pointer-events-none on the bar so clicks on the gradient fall through to the Link */}
        {!selectMode ? (
          <div
            className="absolute bottom-0 left-0 right-0 z-[3] opacity-0 pointer-events-none
                       group-hover:opacity-100
                       transition-opacity duration-200"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
              padding: "20px 7px 7px",
            }}
          >
            {/* Re-enable pointer events only for the button row */}
            <div className="pointer-events-auto w-full">
              <AnimeCardActions mediaId={anime.id} mediaType={anime.type} iconSize="md" />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Mobile icon row — permanent, below poster, logged-in only ── */}
      {isLoggedIn && !selectMode && (
        <div
          className="md:hidden flex justify-center py-1.5 w-full px-1.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <AnimeCardActions mediaId={anime.id} mediaType={anime.type} iconSize="sm" />
        </div>
      )}

      {/* ── Title + meta ── */}
      {!hideTitle && (
        <div className="anime-card-foot" style={{ padding: "6px 8px 8px" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--fg)",
              lineHeight: 1.3,
              minHeight: "2.6em",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "var(--fg-subtle)",
              fontFamily: "var(--font-space-mono)",
              marginTop: 3,
              minHeight: 13,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ") || "\u00A0"}
          </p>
        </div>
      )}
    </div>
  );
}
