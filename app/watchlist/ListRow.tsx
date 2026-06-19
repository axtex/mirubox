"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, ChevronRight } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "./types";
import type { EntryData } from "./types";

interface Props {
  entry: EntryData;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
}

export function ListRow({ entry, onUpdate, onRemove }: Props) {
  const { animeId, anime, status, progress, userScore } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-subtle)";
  const totalEps = anime.episodes;

  const [hovered, setHovered] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showRating, setShowRating] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(userScore);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showStatusSub, setShowStatusSub] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);

  // Sync progress if parent updates (e.g. after status change)
  useEffect(() => {
    if (!editingProgress) setLocalProgress(progress);
  }, [progress, editingProgress]);

  // Sync score if parent updates
  useEffect(() => {
    setLocalScore(userScore);
  }, [userScore]);

  // Close all overlays on outside click
  useEffect(() => {
    if (!editingProgress && !showMenu && !showRating) return;
    function handle(e: MouseEvent) {
      if (!rowRef.current?.contains(e.target as Node)) {
        if (editingProgress) void doCommit(localProgress);
        setShowMenu(false);
        setShowStatusSub(false);
        setShowRating(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [editingProgress, showMenu, showRating, localProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doCommit(p: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEditingProgress(false);
    if (p === progress) return;
    onUpdate(animeId, { progress: p });
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status, progress: p }),
    });
  }

  function adjustProgress(delta: number) {
    const next = Math.max(0, Math.min(totalEps ?? 9999, localProgress + delta));
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
    setShowMenu(false);
    setShowStatusSub(false);
    onUpdate(animeId, { status: newStatus });
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status: newStatus, progress: localProgress }),
    });
  }

  async function handleRemove() {
    setShowMenu(false);
    onRemove(animeId);
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId }),
    });
  }

  const progressPct = totalEps ? Math.round((localProgress / totalEps) * 100) : 0;
  const activeRating = ratingHover ?? localScore;

  return (
    <div
      ref={rowRef}
      className="group flex items-center gap-3 py-2 pr-3 transition-colors"
      style={{
        borderBottom: "1px solid var(--border)",
        background: hovered ? "var(--bg-card)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <Link href={`/anime/${animeId}`} className="shrink-0">
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
        <Link href={`/anime/${animeId}`}>
          <p className="truncate" style={{ fontSize: 13, color: "#e4e1e6", fontWeight: 500 }}>
            {title}
          </p>
        </Link>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 2 }}>
          {anime.format ?? "TV"}{totalEps ? ` · ${totalEps} EP` : ""}
        </p>
      </div>

      {/* Progress — desktop only, Watching status only */}
      <div className="hidden md:flex flex-col gap-1 shrink-0" style={{ width: 110 }}>
        {status === "WATCHING" ? (
          <>
            {editingProgress ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => adjustProgress(-1)}
                  style={btnStyle}
                >−</button>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg)", minWidth: 48, textAlign: "center" }}>
                  EP {localProgress}{totalEps ? ` / ${totalEps}` : ""}
                </span>
                <button
                  onClick={() => adjustProgress(1)}
                  style={btnStyle}
                >+</button>
              </div>
            ) : (
              <p
                onClick={() => setEditingProgress(true)}
                className="cursor-pointer"
                style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}
              >
                EP {localProgress}{totalEps ? ` / ${totalEps}` : ""}
              </p>
            )}
            <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)", borderRadius: 2 }} />
            </div>
          </>
        ) : null}
      </div>

      {/* Mobile-only progress bar (no text) */}
      {status === "WATCHING" && (
        <div className="flex md:hidden absolute left-0 right-0 bottom-0" style={{ height: 2 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
        </div>
      )}

      {/* Rating — desktop only */}
      <div className="hidden md:block relative shrink-0" style={{ width: 52 }}>
        <button
          onClick={() => setShowRating(!showRating)}
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: localScore ? "var(--primary)" : "var(--fg-subtle)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          {localScore ? `★ ${localScore}` : "★ —"}
        </button>

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

      {/* Status dot — desktop only */}
      <div className="hidden md:flex items-center justify-center shrink-0" style={{ width: 20 }}>
        <span
          className="block rounded-full"
          style={{ width: 8, height: 8, background: dotColor }}
          title={STATUS_LABELS[status]}
        />
      </div>

      {/* Kebab menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setShowMenu(!showMenu); setShowStatusSub(false); }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 2,
            border: "1px solid var(--border)",
            background: showMenu ? "var(--bg-elevated)" : "var(--bg-card)",
            color: "var(--fg-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <div
            className="absolute z-30 py-1"
            style={{
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--bg-card-high)",
              border: "1px solid var(--border-bright)",
              borderRadius: 4,
              minWidth: 168,
            }}
          >
            {/* Change Status */}
            <div className="relative">
              <button
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 transition-colors"
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                onClick={() => setShowStatusSub(!showStatusSub)}
              >
                CHANGE STATUS
                <ChevronRight className="w-3 h-3" />
              </button>

              {showStatusSub && (
                <div
                  className="absolute py-1"
                  style={{
                    right: "calc(100% + 4px)",
                    top: 0,
                    background: "var(--bg-card-high)",
                    border: "1px solid var(--border-bright)",
                    borderRadius: 4,
                    minWidth: 148,
                  }}
                >
                  {Object.entries(STATUS_LABELS)
                    .filter(([k]) => k !== status)
                    .map(([k, label]) => (
                      <button
                        key={k}
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
                </div>
              )}
            </div>

            {/* Remove */}
            <button
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
  );
}

const btnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 2,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--fg-muted)",
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
