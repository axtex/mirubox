"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import {
  useArchive,
  STATUS_COLORS,
  isTrackedEntry,
} from "@/lib/archive-context";
import { AnimeCardActions } from "@/components/anime/AnimeCardActions";
import { ReviewModal } from "@/components/detail/ReviewModal";
import { useAuthModal } from "@/context/AuthModalContext";

interface ReviewData {
  content: string;
  containsSpoilers: boolean;
}

interface TrackerSidebarBlockProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  title: string;
  total: number | null;
  initialProgress: number;
  initialRating: number | null;
  initialReview: ReviewData | null;
}

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#5a5a65",
  marginBottom: 6,
};

const BLOCK_STYLE: React.CSSProperties = {
  background: "#1b1b1e",
  border: "1px solid #1f1f22",
  borderRadius: 2,
  padding: "10px 12px",
};

/** Tracked box height when dropdown is open (padding + border included). */
const TRACKED_BOX_MIN_HEIGHT = 183;

export function TrackerSidebarBlock({
  mediaId,
  mediaType,
  title,
  total,
  initialProgress,
  initialRating,
  initialReview,
}: TrackerSidebarBlockProps) {
  const { archiveMap, isLoggedIn } = useArchive();
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

  const entry = archiveMap.get(mediaId) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;

  const [progress, setProgress] = useState(initialProgress);
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [savedReview, setSavedReview] = useState(initialReview);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const unit = mediaType === "MANGA" ? "CH" : "EP";
  const progressPct = total && total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  const sc = status ? (STATUS_COLORS[status] ?? STATUS_COLORS.PLANNED) : null;
  const hasReview = savedReview !== null;
  const displayRating = hoverRating ?? rating ?? 0;

  async function patchProgress(next: number, currentStatus: string) {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: mediaId,
        status: currentStatus,
        progress: next,
        mediaType,
      }),
    });
  }

  async function handleProgress(delta: number) {
    if (!status) return;
    const next = Math.max(0, progress + delta);
    if (total !== null && next > total) return;
    setProgress(next);
    await patchProgress(next, status);
  }

  async function handleRating(score: number) {
    const next = rating === score ? null : score;
    setRating(next);
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
  }

  return (
    <div>
      <p style={SECTION_TITLE}>TRACK</p>
      <div
        style={{
          ...BLOCK_STYLE,
          ...(sc ? { border: `1px solid ${sc.border}`, position: "relative" } : {}),
          ...(isTracked ? { minHeight: TRACKED_BOX_MIN_HEIGHT } : {}),
          ...(isTracked ? { display: "flex", flexDirection: "column" } : {}),
        }}
      >
        <AnimeCardActions
          mediaId={mediaId}
          mediaType={mediaType}
          iconSize="md"
          sidebar
          onPickerOpenChange={setPickerOpen}
        />

        {!isLoggedIn && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9e9ea8",
                marginBottom: 4,
              }}
            >
              RATING
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    openAuthModal({ reason: "rate this title", callbackUrl: pathname })
                  }
                  aria-label={`Rate ${n}`}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
                >
                  <Star size={14} fill="none" stroke="#2a2a2d" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openAuthModal({ reason: "write a review", callbackUrl: pathname })}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "5px 0",
                textAlign: "center",
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-muted)",
                border: "1px solid var(--bg-card-high)",
                borderRadius: 2,
                background: "transparent",
                cursor: "pointer",
                transition: "color 0.15s ease, background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface)";
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.borderColor = "var(--border-bright)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--fg-muted)";
                e.currentTarget.style.borderColor = "var(--bg-card-high)";
              }}
            >
              WRITE A REVIEW
            </button>
          </div>
        )}

        {isTracked && status && !pickerOpen && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            {/* Progress */}
            <div style={{ marginTop: 12 }}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#9e9ea8",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {unit} {progress}
                {total != null ? `/${total}` : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleProgress(-1)}
                  disabled={progress <= 0}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    padding: 0,
                    border: "none",
                    background: "none",
                    color: progress <= 0 ? "#3a3a3d" : "#9e9ea8",
                    cursor: progress <= 0 ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 1,
                    background: "#2a2a2d",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPct}%`,
                      borderRadius: 1,
                      background: sc!.color,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleProgress(1)}
                  disabled={total !== null && progress >= total}
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    padding: 0,
                    border: "none",
                    background: "none",
                    color: total !== null && progress >= total ? "#3a3a3d" : "#9e9ea8",
                    cursor: total !== null && progress >= total ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginTop: 12 }}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#9e9ea8",
                  marginBottom: 4,
                }}
              >
                RATING
              </p>
              <div className="flex gap-1" onMouseLeave={() => setHoverRating(null)}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => void handleRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    aria-label={`Rate ${n}`}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      lineHeight: 0,
                    }}
                  >
                    <Star
                      size={14}
                      fill={n <= displayRating ? "#e8173f" : "none"}
                      stroke={n <= displayRating ? "#e8173f" : "#2a2a2d"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review button */}
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "5px 0",
                textAlign: "center",
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-muted)",
                border: "1px solid var(--bg-card-high)",
                borderRadius: 2,
                background: "transparent",
                cursor: "pointer",
                transition: "color 0.15s ease, background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface)";
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.borderColor = "var(--border-bright)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--fg-muted)";
                e.currentTarget.style.borderColor = "var(--bg-card-high)";
              }}
            >
              {hasReview ? "EDIT REVIEW" : "WRITE A REVIEW"}
            </button>

            {reviewOpen && (
              <ReviewModal
                mediaId={mediaId}
                title={title}
                initialReview={savedReview}
                onClose={() => setReviewOpen(false)}
                onSave={(review) => {
                  setSavedReview(review);
                  setReviewOpen(false);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
