"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { AnimeCardActions } from "@/components/anime/AnimeCardActions";
import { ReviewBadge } from "@/components/tracker/ReviewBadge";
import { RatingBadge } from "@/components/tracker/RatingBadge";
import { formatEntryMetadata } from "./types";
import type { EntryData } from "./types";
import { TRACKER_BADGE } from "@/components/tracker/badgeStyles";
import { ProgressCountInput } from "@/components/tracker/ProgressCountInput";
import { trackerProgressPct } from "@/lib/tracker-progress";

interface Props {
  entry: EntryData;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
  onFavouriteChange?: (animeId: number, isFavourite: boolean) => void;
}

export function ListRow({ entry, onUpdate, onRemove, onFavouriteChange }: Props) {
  const { animeId, anime, status, mediaType, progress, userScore, hasReview } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const isManga = mediaType === "MANGA";
  const href = isManga ? `/manga/${animeId}` : `/anime/${animeId}`;
  const progressLabel = isManga ? "CH" : "EP";
  const total = entry.total ?? (isManga ? anime.chapters : anime.episodes);

  const [hovered, setHovered] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showRating, setShowRating] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(userScore);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);

  const trackerCallbacks = {
    onTrackerChange: (nextStatus: string | null) => {
      if (nextStatus === null) onRemove(animeId);
      else onUpdate(animeId, { status: nextStatus });
    },
    onFavouriteChange: (isFavourite: boolean) => onFavouriteChange?.(animeId, isFavourite),
  };

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!rowRef.current?.contains(e.target as Node)) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
          if (localProgress !== progress) void doCommit(localProgress);
        }
        setShowRating(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [localProgress, progress, showRating]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalScore(userScore);
  }, [userScore]);

  async function doCommit(p: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    if (p === progress) return;
    onUpdate(animeId, { progress: p });
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status, progress: p }),
    });
  }

  function setProgressValue(next: number) {
    const clamped = Math.max(0, Math.min(total ?? 9999, next));
    setLocalProgress(clamped);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doCommit(clamped); }, 1500);
  }

  function adjustProgress(delta: number) {
    setProgressValue(localProgress + delta);
  }

  function commitProgressInput(next: number) {
    const clamped = Math.max(0, Math.min(total ?? 9999, next));
    setLocalProgress(clamped);
    void doCommit(clamped);
  }

  async function handleRate(score: number) {
    if (ratingLoading) return;
    setRatingLoading(true);
    setLocalScore(score);
    onUpdate(animeId, { userScore: score });
    setShowRating(false);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, score }),
      });
    } finally {
      setRatingLoading(false);
    }
  }

  const progressPct = trackerProgressPct(localProgress, total, isManga ? "MANGA" : "ANIME");
  const activeRating = ratingHover ?? localScore;

  return (
    <div
      ref={rowRef}
      className="group flex items-center gap-3 py-2 pr-5 transition-colors relative"
      style={{
        borderBottom: "1px solid var(--border)",
        background: hovered ? "var(--bg-card)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <Link href={href} className="shrink-0">
        <div className="relative overflow-hidden" style={{ width: 40, height: 56, borderRadius: 2 }}>
          {anime.coverImage ? (
            <ImageWithFallback src={anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
          )}
        </div>
      </Link>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <Link href={href} className="flex items-center gap-2 min-w-0">
          <p className="truncate" style={{ fontSize: 13, color: "#e4e1e6", fontWeight: 500 }}>
            {title}
          </p>
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}>
            {formatEntryMetadata(entry)}
          </p>
        </div>
      </div>

      {/* Mobile-only progress bar */}
      {status === "IN_PROGRESS" && (
        <div className="flex md:hidden absolute left-0 right-0 bottom-0" style={{ height: 2 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
        </div>
      )}

      {/* Progress + rating + review + status/heart */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-3">
        {status === "IN_PROGRESS" && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            style={{ height: TRACKER_BADGE.minHeight }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                lineHeight: 1,
              }}
            >
              {progressLabel}
              <ProgressCountInput
                value={localProgress}
                total={total}
                ariaLabel={`${progressLabel} progress`}
                onCommit={commitProgressInput}
              />
              {total ? ` / ${total}` : ""}
            </span>
            <button type="button" onClick={() => adjustProgress(1)} className="shrink-0" style={btnStyle} aria-label="Increase progress">+</button>
            <div
              className="shrink-0"
              style={{ width: 48, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}
            >
              <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }} />
            </div>
            <button type="button" onClick={() => adjustProgress(-1)} className="shrink-0" style={btnStyle} aria-label="Decrease progress">−</button>
          </div>
        )}

        <div className="relative flex items-center shrink-0">
          <RatingBadge
            as="button"
            type="button"
            score={localScore}
            className="shrink-0"
            onClick={() => setShowRating(!showRating)}
          />

          {showRating && (
            <div
              className="absolute z-20 p-2"
              style={{
                bottom: "calc(100% + 4px)",
                right: 0,
                background: "var(--bg-card-high)",
                border: "1px solid var(--border-bright)",
                borderRadius: 4,
                width: 128,
              }}
            >
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "var(--fg-subtle)", marginBottom: 6, letterSpacing: "0.05em" }}>
                YOUR RATING
              </p>
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    disabled={ratingLoading}
                    onClick={() => void handleRate(n)}
                    onMouseEnter={() => setRatingHover(n)}
                    onMouseLeave={() => setRatingHover(null)}
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 0",
                      borderRadius: 2,
                      border: `1px solid ${activeRating !== null && n <= activeRating ? "var(--primary)" : "var(--border)"}`,
                      background: activeRating !== null && n <= activeRating ? "var(--primary)" : "var(--bg-card)",
                      color: activeRating !== null && n <= activeRating ? "#fff" : "var(--fg-subtle)",
                      cursor: ratingLoading ? "not-allowed" : "pointer",
                      textAlign: "center",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link
          href={`${href}#review`}
          aria-label={hasReview ? "View review" : "Write review"}
          className="inline-flex items-center shrink-0"
        >
          <ReviewBadge active={hasReview} className="shrink-0" />
        </Link>
        </div>

        <AnimeCardActions
          mediaId={animeId}
          mediaType={mediaType}
          iconSize="sm"
          opaque
          listLayout
          {...trackerCallbacks}
        />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  flexShrink: 0,
  border: "none",
  background: "transparent",
  color: "var(--fg-muted)",
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 2px",
  margin: 0,
  appearance: "none",
  WebkitAppearance: "none",
};
