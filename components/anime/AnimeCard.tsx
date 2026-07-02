"use client";

import Link from "next/link";
import Image from "next/image";
import { getDisplayTitle } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import { AnimeCardActions } from "./AnimeCardActions";
import { useArchive, STATUS_COLORS, isTrackedEntry } from "@/lib/archive-context";

interface AnimeCardProps {
  anime: AnimeCardType;
  size?: "sm" | "md" | "lg";
  /** Kept for backward compat — context is now the source of truth */
  watchlistStatus?: string | null;
  userRating?: number | null;
  similarity?: number | null;
  hideTitle?: boolean;
}

const IMAGE_SIZES = {
  sm: "100px",
  md: "(min-width: 768px) 15vw, 140px",
  lg: "(min-width: 768px) 20vw, 180px",
};

export function AnimeCard({
  anime,
  size = "md",
  similarity,
  hideTitle = false,
}: AnimeCardProps) {
  const { isLoggedIn, archiveMap } = useArchive();

  const entry = archiveMap.get(anime.id) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;
  const sc = status ? (STATUS_COLORS[status] ?? null) : null;

  const title = getDisplayTitle(anime.title);
  const score = anime.averageScore;
  const detailHref = anime.type === "MANGA" ? `/manga/${anime.id}` : `/anime/${anime.id}`;

  return (
    <div
      tabIndex={0}
      className={`anime-card anime-card--${size} group relative`}
      style={{
        borderRadius: 4,
        border: sc ? `1px solid ${sc.border}` : "1px solid #1f1f22",
        transition: "border-color 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* ── Poster ── */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        {anime.coverImage.extraLarge || anime.coverImage.large ? (
          <Image
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

        {/* Transparent link covering the whole poster */}
        <Link
          href={detailHref}
          className="absolute inset-0 z-[1]"
          aria-label={`View ${title}`}
        />

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
      </div>

      {/* ── Mobile icon row — permanent, below poster, logged-in only ── */}
      {isLoggedIn && (
        <div
          className="md:hidden flex justify-center py-1.5 w-full px-1.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <AnimeCardActions mediaId={anime.id} mediaType={anime.type} iconSize="sm" />
        </div>
      )}

      {/* ── Title + meta ── */}
      {!hideTitle && (
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
          {(anime.format || anime.seasonYear) && (
            <p
              style={{
                fontSize: 10,
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-space-mono)",
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ")}
            </p>
          )}
          {similarity != null && (
            <p
              style={{
                fontSize: 10,
                fontFamily: "var(--font-space-mono)",
                color: "var(--primary)",
                marginTop: 3,
              }}
            >
              {Math.round(similarity * 100)}% MATCH
            </p>
          )}
        </div>
      )}
    </div>
  );
}
