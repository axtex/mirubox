"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { STATUS_COLORS } from "@/lib/archive-context";
import { AddToListButton } from "@/components/lists/AddToListModal";

const STATUSES = [
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED",   label: "COMPLETED" },
  { value: "PLANNED",     label: "PLANNED" },
  { value: "DROPPED",     label: "DROPPED" },
  { value: "ON_HOLD",     label: "ON HOLD" },
] as const;

interface DetailTrackerBarProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  initialStatus: string;
  initialProgress: number;
  initialTotal: number | null;
  initialRating: number | null;
  initialReview: { content: string; containsSpoilers: boolean } | null;
  isLoggedIn: boolean;
}

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  letterSpacing: "0.1em",
  color: "#5a5a65",
  marginBottom: 6,
};

export function DetailTrackerBar({
  mediaId,
  mediaType,
  initialStatus,
  initialProgress,
  initialTotal,
  initialRating,
  initialReview,
  isLoggedIn,
}: DetailTrackerBarProps) {
  const [status] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [total] = useState(initialTotal);
  const [rating, setRating] = useState(initialRating);
  const [reviewContent, setReviewContent] = useState(initialReview?.content ?? "");
  const [containsSpoilers, setContainsSpoilers] = useState(initialReview?.containsSpoilers ?? false);
  const [savedReview, setSavedReview] = useState(initialReview);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const unit = mediaType === "MANGA" ? "CH" : "EP";
  const statusLabel =
    mediaType === "MANGA" && status === "IN_PROGRESS"
      ? "READING"
      : status === "IN_PROGRESS"
      ? "WATCHING"
      : STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, " ");

  const progressPct = total && total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS["PLANNED"];

  useEffect(() => {
    if (!expanded) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [expanded]);

  async function patchWatchlist(updates: { progress?: number; rating?: number | null }) {
    setSaving(true);
    try {
      if (updates.rating !== undefined) {
        if (updates.rating === null) {
          await fetch("/api/ratings", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animeId: mediaId }),
          });
        } else {
          await fetch("/api/ratings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animeId: mediaId, score: updates.rating }),
          });
        }
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId: mediaId,
            status,
            progress: updates.progress ?? progress,
            mediaType,
          }),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleProgress(delta: number) {
    const next = Math.max(0, progress + delta);
    if (total !== null && next > total) return;
    setProgress(next);
    await patchWatchlist({ progress: next });
  }

  async function handleRating(score: number) {
    const next = rating === score ? null : score;
    setRating(next);
    await patchWatchlist({ rating: next });
  }

  const trimmedReview = reviewContent.trim();
  const hasReview = savedReview !== null;
  const hasReviewChanges =
    trimmedReview !== (savedReview?.content ?? "") ||
    containsSpoilers !== (savedReview?.containsSpoilers ?? false);

  async function handleReviewSave() {
    if (!trimmedReview || reviewSaving) return;

    setReviewSaving(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, content: trimmedReview, containsSpoilers }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setReviewError(data.error ?? "Failed to save review");
        return;
      }
      setSavedReview({ content: trimmedReview, containsSpoilers });
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleReviewDelete() {
    if (reviewSaving || !hasReview) return;
    if (!window.confirm("Delete your review?")) return;

    setReviewSaving(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId }),
      });
      if (!res.ok) {
        setReviewError("Failed to delete review");
        return;
      }
      setReviewContent("");
      setContainsSpoilers(false);
      setSavedReview(null);
    } finally {
      setReviewSaving(false);
    }
  }

  const barLabel = total
    ? `${statusLabel} · ${unit} ${progress} / ${total}`
    : `${statusLabel}${progress > 0 ? ` · ${unit} ${progress}` : ""}`;

  return (
    <div ref={ref}>
      {/* Slim bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        style={{
          background: "var(--bg-card)",
          border: "1px solid #2a2a2d",
          borderRadius: 2,
          padding: "8px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            color: sc.color,
          }}
        >
          {saving ? "SAVING…" : barLabel}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "#5a5a65",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* 3px progress bar */}
      <div style={{ height: 3, background: "#1f1f22", borderRadius: 0 }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "var(--primary)",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid #2a2a2d",
            borderTop: "none",
            borderRadius: "0 0 2px 2px",
            padding: "12px 12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div>
            <p style={SECTION_LABEL}>LIST</p>
            <div className="flex">
              <AddToListButton mediaId={mediaId} mediaType={mediaType} isLoggedIn={isLoggedIn} />
            </div>
          </div>

          {/* Progress counter */}
          <div>
            <p style={SECTION_LABEL}>
              {unit === "EP" ? "EPISODES" : "CHAPTERS"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleProgress(-1)}
                disabled={progress <= 0}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  border: "1px solid #2a2a2d",
                  background: "transparent",
                  color: progress <= 0 ? "#3a3a3d" : "#9e9ea8",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 14,
                  cursor: progress <= 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 12,
                  color: "#e4e1e6",
                  minWidth: 40,
                  textAlign: "center",
                }}
              >
                {progress}{total ? ` / ${total}` : ""}
              </span>
              <button
                type="button"
                onClick={() => void handleProgress(1)}
                disabled={total !== null && progress >= total}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  border: "1px solid #2a2a2d",
                  background: "transparent",
                  color: (total !== null && progress >= total) ? "#3a3a3d" : "#9e9ea8",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 14,
                  cursor: (total !== null && progress >= total) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Rating */}
          <div>
            <p style={SECTION_LABEL}>YOUR RATING</p>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = rating !== null && n <= rating;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => void handleRating(n)}
                    style={{
                      width: 26,
                      height: 26,
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 2,
                      border: `1px solid ${active ? "var(--primary)" : "#2a2a2d"}`,
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "#5a5a65",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.1s ease",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p style={SECTION_LABEL}>YOUR REVIEW</p>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your thoughts…"
              rows={3}
              maxLength={10000}
              disabled={reviewSaving}
              className="w-full resize-y outline-none"
              style={{
                fontFamily: "var(--font-anybody)",
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--fg)",
                background: "var(--bg-surface)",
                border: "1px solid #2a2a2d",
                borderRadius: 2,
                padding: "8px 10px",
              }}
            />
            <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={containsSpoilers}
                onChange={(e) => setContainsSpoilers(e.target.checked)}
                disabled={reviewSaving}
                style={{ accentColor: "var(--primary)" }}
              />
              <span style={{ ...SECTION_LABEL, marginBottom: 0 }}>CONTAINS SPOILERS</span>
            </label>
            <div className="mt-2 flex items-center justify-end gap-2 flex-wrap">
              {reviewError && (
                <span style={{ ...SECTION_LABEL, marginBottom: 0, color: "var(--primary)" }}>
                  {reviewError}
                </span>
              )}
              {hasReview && (
                <button
                  type="button"
                  onClick={() => void handleReviewDelete()}
                  disabled={reviewSaving}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    letterSpacing: "0.06em",
                    color: "#5a5a65",
                    background: "none",
                    border: "none",
                    cursor: reviewSaving ? "not-allowed" : "pointer",
                    padding: 0,
                  }}
                >
                  DELETE
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleReviewSave()}
                disabled={reviewSaving || !trimmedReview || (hasReview && !hasReviewChanges)}
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  padding: "5px 10px",
                  borderRadius: 2,
                  border: "1px solid var(--primary)",
                  background: hasReview && !hasReviewChanges ? "transparent" : "var(--primary)",
                  color: hasReview && !hasReviewChanges ? "#5a5a65" : "#fff",
                  cursor:
                    reviewSaving || !trimmedReview || (hasReview && !hasReviewChanges)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    reviewSaving || !trimmedReview || (hasReview && !hasReviewChanges) ? 0.5 : 1,
                }}
              >
                {reviewSaving ? "SAVING…" : hasReview ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
