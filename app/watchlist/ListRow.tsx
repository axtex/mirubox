"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ReviewBadge } from "@/components/tracker/ReviewBadge";
import { RatingBadge } from "@/components/tracker/RatingBadge";
import { STATUS_COLORS, STATUS_LABELS, formatEntryMetadata } from "./types";
import type { EntryData } from "./types";
import { trackerStatusDropdownTriggerStyle, TRACKER_BADGE } from "@/components/tracker/badgeStyles";

interface Props {
  entry: EntryData;
  showTypeBadge?: boolean;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
}

export function ListRow({ entry, showTypeBadge = false, onUpdate, onRemove }: Props) {
  const { animeId, anime, status, mediaType, progress, userScore, hasReview } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-subtle)";
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

  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);

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
        setShowStatusPicker(false);
        setShowRating(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [localProgress, progress, showRating, showStatusPicker]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalScore(userScore);
  }, [userScore]);

  async function doCommit(p: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    if (p === progress) return;
    onUpdate(animeId, { progress: p });
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status, progress: p }),
    });
  }

  function adjustProgress(delta: number) {
    const next = Math.max(0, Math.min(total ?? 9999, localProgress + delta));
    setLocalProgress(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doCommit(next); }, 1500);
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

  async function handleStatusChange(newStatus: string) {
    setShowStatusPicker(false);
    onUpdate(animeId, { status: newStatus });
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status: newStatus, progress: localProgress }),
    });
  }

  async function handleRemove() {
    setShowStatusPicker(false);
    onRemove(animeId);
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId }),
    });
  }

  const progressPct = total ? Math.round((localProgress / total) * 100) : 0;
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
            <Image src={anime.coverImage} alt={title} fill sizes="40px" className="object-cover" />
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
          {showTypeBadge && (
            <span
              className="shrink-0"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 8,
                color: isManga ? "#a78bfa" : "#60a5fa",
                background: isManga ? "rgba(167,139,250,0.1)" : "rgba(96,165,250,0.1)",
                border: `1px solid ${isManga ? "rgba(167,139,250,0.2)" : "rgba(96,165,250,0.2)"}`,
                borderRadius: 2,
                padding: "1px 4px",
                letterSpacing: "0.04em",
              }}
            >
              {isManga ? "MANGA" : "ANIME"}
            </span>
          )}
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

      {/* Progress + actions — single row, vertically aligned */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {status === "IN_PROGRESS" && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            style={{ height: TRACKER_BADGE.minHeight }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => adjustProgress(-1)} className="shrink-0" style={btnStyle} aria-label="Decrease progress">−</button>
            <span
              className="shrink-0 whitespace-nowrap"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {progressLabel} {localProgress}{total ? ` / ${total}` : ""}
            </span>
            <button type="button" onClick={() => adjustProgress(1)} className="shrink-0" style={btnStyle} aria-label="Increase progress">+</button>
            <div
              className="shrink-0"
              style={{ width: 48, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}
            >
              <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }} />
            </div>
          </div>
        )}

        <div className="relative flex items-center shrink-0">
          <RatingBadge
            as="button"
            type="button"
            score={localScore}
            className="shrink-0"
            onClick={() => {
              setShowRating(!showRating);
              setShowStatusPicker(false);
            }}
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

        <div className="relative flex items-center shrink-0">
          <button
            type="button"
            aria-label={`Status: ${STATUS_LABELS[status] ?? status}. Change status or remove`}
            aria-expanded={showStatusPicker}
            aria-haspopup="menu"
            onClick={() => {
              setShowStatusPicker((open) => !open);
              setShowRating(false);
            }}
            style={{
              ...trackerStatusDropdownTriggerStyle,
              background: showStatusPicker ? "var(--bg-elevated)" : "transparent",
              border: showStatusPicker ? "1px solid var(--border-bright)" : "1px solid var(--border)",
              color: "var(--fg-subtle)",
            }}
          >
            <span
              className="block rounded-full shrink-0"
              style={{ width: TRACKER_BADGE.dotSize, height: TRACKER_BADGE.dotSize, background: dotColor }}
            />
            <ChevronDown
              size={TRACKER_BADGE.chevronSize}
              className="shrink-0"
              style={{
                transition: "transform 0.15s ease",
                transform: showStatusPicker ? "rotate(180deg)" : "none",
              }}
            />
          </button>

          {showStatusPicker && (
            <div
              className="absolute z-30 py-1"
              role="menu"
              style={{
                right: 0,
                top: "calc(100% + 4px)",
                background: "var(--bg-card-high)",
                border: "1px solid var(--border-bright)",
                borderRadius: 4,
                minWidth: 168,
              }}
            >
              {Object.entries(STATUS_LABELS)
                .filter(([k]) => k !== status)
                .map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors"
                    style={menuItemStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    onClick={() => void handleStatusChange(k)}
                  >
                    <span className="block rounded-full shrink-0" style={{ width: 6, height: 6, background: STATUS_COLORS[k] }} />
                    {label.toUpperCase()}
                  </button>
                ))}
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors"
                style={{ ...menuItemStyle, color: "#e61e2a" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                onClick={() => void handleRemove()}
              >
                REMOVE FROM TRACKER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: TRACKER_BADGE.minHeight,
  height: TRACKER_BADGE.minHeight,
  flexShrink: 0,
  borderRadius: 2,
  border: "1px solid var(--border-bright)",
  background: "var(--bg-card)",
  color: "var(--fg)",
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
};

const menuItemStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "var(--fg-muted)",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "0.04em",
};
