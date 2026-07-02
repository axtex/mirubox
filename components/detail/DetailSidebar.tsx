"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useArchive, STATUS_COLORS, isTrackedEntry } from "@/lib/archive-context";

const STATUSES = [
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED",   label: "COMPLETED" },
  { value: "PLANNED",     label: "PLANNED" },
  { value: "DROPPED",     label: "DROPPED" },
  { value: "ON_HOLD",     label: "ON HOLD" },
] as const;

interface SidebarDetailsRow {
  label: string;
  value: string | null | undefined;
}

interface DetailSidebarProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  details: SidebarDetailsRow[];
  genres: string[];
  genreSearchPrefix: string;
  initialProgress: number;
  initialTotal: number | null;
  initialRating: number | null;
}

const BLOCK_STYLE: React.CSSProperties = {
  background: "#1b1b1e",
  border: "1px solid #1f1f22",
  borderRadius: 2,
  padding: "10px 12px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "#5a5a65",
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "#9e9ea8",
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#5a5a65",
  marginBottom: 6,
};

export function DetailSidebar({
  mediaId,
  mediaType,
  details,
  genres,
  genreSearchPrefix,
  initialProgress,
  initialTotal,
  initialRating,
}: DetailSidebarProps) {
  const { isLoggedIn, archiveMap, addToArchive } = useArchive();
  const entry = archiveMap.get(mediaId) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;
  const sc = status ? (STATUS_COLORS[status] ?? null) : null;

  const [progress, setProgress] = useState(initialProgress);
  const [rating, setRating] = useState(initialRating);
  const [saving, setSaving] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showRatingPicker, setShowRatingPicker] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);

  const total = initialTotal;
  const unit = mediaType === "MANGA" ? "CH" : "EP";
  const progressPct = total && total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  const statusLabel =
    mediaType === "MANGA" && status === "IN_PROGRESS"
      ? "READING"
      : status === "IN_PROGRESS"
      ? "WATCHING"
      : status
      ? (STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, " "))
      : null;

  useEffect(() => {
    if (!showStatusPicker) return;
    function close(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusPicker(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showStatusPicker]);

  useEffect(() => {
    if (!showRatingPicker) return;
    function close(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setShowRatingPicker(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showRatingPicker]);

  async function patchProgress(newProgress: number, newStatus?: string) {
    setSaving(true);
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: mediaId,
          status: newStatus ?? status ?? "PLANNED",
          progress: newProgress,
          mediaType,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleProgressDelta(delta: number) {
    const next = Math.max(0, progress + delta);
    if (total !== null && next > total) return;
    setProgress(next);
    await patchProgress(next);
  }

  async function handleStatusChange(newStatus: string) {
    setShowStatusPicker(false);
    setSaving(true);
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, status: newStatus, progress, mediaType }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRating(score: number) {
    const next = rating === score ? null : score;
    setRating(next);
    setShowRatingPicker(false);
    setSaving(true);
    try {
      if (next === null) {
        await fetch("/api/ratings", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: mediaId }),
        });
      } else {
        await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: mediaId, score: next }),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const showGenresBlock = genres.length > 5;

  return (
    <div className="flex flex-col gap-4">
      {/* DETAILS BLOCK */}
      <div>
        <p style={SECTION_TITLE}>DETAILS</p>
        <div style={BLOCK_STYLE}>
          {details
            .filter((row) => row.value != null && row.value !== "")
            .map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "4px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #131316" : "none",
                }}
              >
                <span style={LABEL_STYLE}>{row.label}</span>
                <span
                  style={{ ...VALUE_STYLE, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ARCHIVE BLOCK — logged in only */}
      {isLoggedIn && (
        <div>
          <p style={SECTION_TITLE}>IN YOUR ARCHIVE</p>
          {isTracked && status ? (
            <div style={BLOCK_STYLE}>
              {/* Status label */}
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  color: sc?.color ?? "#9e9ea8",
                  marginBottom: 2,
                }}
              >
                {saving ? "SAVING…" : statusLabel}
              </p>

              {/* Progress text */}
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#9e9ea8",
                  marginBottom: 4,
                }}
              >
                {unit} {progress}{total ? ` / ${total}` : ""}
              </p>

              {/* Progress bar */}
              <div style={{ height: 3, background: "#131316", borderRadius: 2, marginBottom: 8 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "var(--primary)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* +/− buttons */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => void handleProgressDelta(-1)}
                  disabled={progress <= 0}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 2,
                    border: "1px solid #2a2a2d",
                    background: "transparent",
                    color: progress <= 0 ? "#3a3a3d" : "#9e9ea8",
                    cursor: progress <= 0 ? "not-allowed" : "pointer",
                  }}
                >
                  − {unit}
                </button>
                <button
                  type="button"
                  onClick={() => void handleProgressDelta(1)}
                  disabled={total !== null && progress >= total}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 2,
                    border: "1px solid #2a2a2d",
                    background: "transparent",
                    color: (total !== null && progress >= total) ? "#3a3a3d" : "#9e9ea8",
                    cursor: (total !== null && progress >= total) ? "not-allowed" : "pointer",
                  }}
                >
                  + {unit}
                </button>
              </div>

              {/* Rating */}
              <div ref={ratingRef} className="relative mb-2">
                <button
                  type="button"
                  onClick={() => setShowRatingPicker((v) => !v)}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: rating ? "#e4e1e6" : "#5a5a65",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {rating ? `★ ${rating} / 10` : "Rate this →"}
                </button>
                {showRatingPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 4px)",
                      left: 0,
                      background: "#1f1f22",
                      border: "1px solid #2a2a2d",
                      borderRadius: 2,
                      padding: "8px",
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      zIndex: 20,
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                      const active = rating !== null && n <= rating;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => void handleRating(n)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 2,
                            border: `1px solid ${active ? "var(--primary)" : "#2a2a2d"}`,
                            background: active ? "var(--primary)" : "transparent",
                            color: active ? "#fff" : "#5a5a65",
                            fontFamily: "var(--font-space-mono)",
                            fontSize: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Change status */}
              <div ref={statusRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowStatusPicker((v) => !v)}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    letterSpacing: "0.06em",
                    color: "#5a5a65",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  CHANGE STATUS
                </button>
                {showStatusPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#1f1f22",
                      border: "1px solid #2a2a2d",
                      borderRadius: 2,
                      overflow: "hidden",
                      zIndex: 20,
                    }}
                  >
                    {STATUSES.map(({ value, label }) => {
                      const optSc = STATUS_COLORS[value];
                      const isActive = status === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => void handleStatusChange(value)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "5px 8px",
                            fontFamily: "var(--font-space-mono)",
                            fontSize: 9,
                            letterSpacing: "0.06em",
                            color: isActive ? optSc.color : "#5a5a65",
                            background: isActive ? optSc.bg : "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={BLOCK_STYLE}>
              <button
                type="button"
                onClick={() => void addToArchive(mediaId, mediaType, "PLANNED")}
                className="btn-primary w-full justify-center"
                style={{ fontSize: 10, padding: "8px 12px", minHeight: 36 }}
              >
                + ADD TO ARCHIVE
              </button>
            </div>
          )}
        </div>
      )}

      {/* GENRES BLOCK — only if more than 5 genres */}
      {showGenresBlock && (
        <div id="sidebar-genres">
          <p style={SECTION_TITLE}>GENRES</p>
          <div style={BLOCK_STYLE}>
            {genres.map((g) => (
              <Link
                key={g}
                href={`${genreSearchPrefix}${encodeURIComponent(g)}`}
                style={{
                  display: "block",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#9e9ea8",
                  padding: "3px 0",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e4e1e6"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9e9ea8"; }}
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
