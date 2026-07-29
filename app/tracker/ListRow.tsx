"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { AnimeCardActions } from "@/components/anime/AnimeCardActions";
import { ReviewBadge } from "@/components/tracker/ReviewBadge";
import { RatingBadge } from "@/components/tracker/RatingBadge";
import { ReviewModal } from "@/components/detail/ReviewModal";
import { formatEntryMetadata } from "./types";
import type { EntryData } from "./types";
import { TRACKER_BADGE } from "@/components/tracker/badgeStyles";
import { ProgressCountInput } from "@/components/tracker/ProgressCountInput";
import { trackerProgressPct } from "@/lib/tracker-progress";
import { useTracker } from "@/lib/tracker-context";

interface ReviewData {
  content: string;
  containsSpoilers: boolean;
}

interface Props {
  entry: EntryData;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
  onFavouriteChange?: (animeId: number, isFavourite: boolean) => void;
}

export function ListRow({ entry, onUpdate, onRemove, onFavouriteChange }: Props) {
  const { animeId, anime, status, mediaType, progress, userScore, hasReview } = entry;
  const { syncTrackerStatus } = useTracker();
  const title = anime.titleEnglish ?? anime.title;
  const isManga = mediaType === "MANGA";
  const href = isManga ? `/manga/${animeId}` : `/anime/${animeId}`;
  const progressLabel = isManga ? "CH" : "EP";
  const total = entry.total ?? (isManga ? anime.chapters : anime.episodes);

  const [hovered, setHovered] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Last progress persisted (or queued) — distinct from entry.progress after optimistic bumps. */
  const committedRef = useRef(progress);

  const [showRating, setShowRating] = useState(false);
  const [localScore, setLocalScore] = useState<number | null>(userScore);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<ReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);

  const trackerCallbacks = {
    onTrackerChange: (nextStatus: string | null) => {
      if (nextStatus === null) {
        onRemove(animeId);
        return;
      }
      if (nextStatus === "COMPLETED" && total != null && total > 0) {
        setLocalProgress(total);
        onUpdate(animeId, { status: nextStatus, progress: total });
        return;
      }
      onUpdate(animeId, { status: nextStatus });
    },
    onFavouriteChange: (isFavourite: boolean) => onFavouriteChange?.(animeId, isFavourite),
  };

  useEffect(() => {
    setLocalProgress(progress);
    committedRef.current = progress;
  }, [progress]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!rowRef.current?.contains(e.target as Node)) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
          if (localProgress !== committedRef.current) void doCommit(localProgress);
        }
        setShowRating(false);
      }
    }
    function flushPending(): void {
      if (!debounceRef.current) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      if (localProgress !== committedRef.current) void doCommit(localProgress);
    }
    function onHidden(): void {
      if (document.visibilityState === "hidden") flushPending();
    }
    document.addEventListener("mousedown", handle);
    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("pagehide", flushPending);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [localProgress, progress, showRating]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalScore(userScore);
  }, [userScore]);

  function nextStatusForProgress(p: number): string {
    let next = status;
    if (total != null && total > 0) {
      if (status === "COMPLETED" && p < total) next = "IN_PROGRESS";
      else if (status !== "COMPLETED" && p >= total) next = "COMPLETED";
    }
    if (next === "PLANNED") next = "IN_PROGRESS";
    return next;
  }

  function applyProgressLocally(p: number): string {
    const nextStatus = nextStatusForProgress(p);
    onUpdate(animeId, {
      progress: p,
      ...(nextStatus !== status ? { status: nextStatus } : {}),
    });
    if (nextStatus !== status) syncTrackerStatus(animeId, nextStatus);
    return nextStatus;
  }

  async function doCommit(p: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    if (p === committedRef.current) return;
    committedRef.current = p;
    const nextStatus = applyProgressLocally(p);
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status: nextStatus, progress: p }),
    });
  }

  function setProgressValue(next: number) {
    const clamped = Math.max(0, Math.min(total ?? 9999, next));
    setLocalProgress(clamped);
    // Bump Most Recent order immediately; network persists after debounce.
    applyProgressLocally(clamped);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doCommit(clamped); }, 400);
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
    const prev = localScore;
    const next = localScore === score ? null : score;
    setRatingLoading(true);
    setLocalScore(next);
    onUpdate(animeId, { userScore: next });
    setShowRating(false);
    try {
      const res =
        next === null
          ? await fetch("/api/ratings", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ animeId }),
            })
          : await fetch("/api/ratings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ animeId, score: next }),
            });
      if (!res.ok) throw new Error("Failed to update rating");
    } catch {
      setLocalScore(prev);
      onUpdate(animeId, { userScore: prev });
    } finally {
      setRatingLoading(false);
    }
  }

  async function openReview() {
    if (reviewLoading) return;
    if (!hasReview) {
      setReviewDraft(null);
      setReviewOpen(true);
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/reviews?animeId=${animeId}`);
      if (!res.ok) throw new Error("Failed to load review");
      const data = (await res.json()) as { review: ReviewData | null };
      setReviewDraft(
        data.review
          ? { content: data.review.content, containsSpoilers: data.review.containsSpoilers }
          : null,
      );
    } catch {
      setReviewDraft(null);
    } finally {
      setReviewLoading(false);
      setReviewOpen(true);
    }
  }

  const progressPct = trackerProgressPct(localProgress, total, isManga ? "MANGA" : "ANIME");
  const displayRating = ratingHover ?? localScore ?? 0;

  return (
    <div
      ref={rowRef}
      className="group flex items-start md:items-center gap-3 py-2 pr-5 transition-colors relative"
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
      <div className="flex md:hidden absolute left-0 right-0 bottom-0" style={{ height: 2 }}>
        <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
      </div>

      {/* Progress + rating + review + status/heart */}
      <div
        className="flex flex-col items-stretch shrink-0 w-[118px] md:w-auto md:items-end"
        style={{ gap: 4 }}
      >
        <div className="flex items-center gap-3 justify-end md:w-auto">
          <div className="hidden md:flex items-center gap-3">
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
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: 4,
                  width: 128,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 8,
                    color: "var(--fg-subtle)",
                    marginBottom: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  YOUR RATING
                </p>
                <div className="grid grid-cols-5 gap-0.5" onMouseLeave={() => setRatingHover(null)}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={ratingLoading}
                      onClick={() => void handleRate(n)}
                      onMouseEnter={() => setRatingHover(n)}
                      aria-label={`Rate ${n}`}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "3px 0",
                        cursor: ratingLoading ? "not-allowed" : "pointer",
                        lineHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star
                        size={14}
                        className="shrink-0"
                        fill={n <= displayRating ? "var(--primary)" : "none"}
                        stroke={n <= displayRating ? "var(--primary)" : "var(--bg-card-high)"}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void openReview()}
            disabled={reviewLoading}
            aria-label={hasReview ? "Edit review" : "Write review"}
            aria-busy={reviewLoading}
            className="inline-flex items-center shrink-0"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: reviewLoading ? "wait" : "pointer",
            }}
          >
            <ReviewBadge active={hasReview} className="shrink-0" />
          </button>
          </div>

          <div className="w-full md:w-auto">
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

        {/* Mobile progress — mirrors status/heart row width; number centered */}
        {status === "IN_PROGRESS" && (
          <div
            className="flex md:hidden items-center w-full"
            style={{ gap: ACTIONS_GAP }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => adjustProgress(1)}
              aria-label="Increase progress"
              className="shrink-0"
              style={mobileProgressBtnStyle}
            >
              +
            </button>
            <span
              className="flex-1 inline-flex items-center justify-center gap-0.5 min-w-0"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-muted)",
                lineHeight: 1,
              }}
            >
              <ProgressCountInput
                value={localProgress}
                total={total}
                ariaLabel={`${progressLabel} progress`}
                onCommit={commitProgressInput}
                fontSize={9}
              />
              {total != null ? ` / ${total}` : ""}
            </span>
            <button
              type="button"
              onClick={() => adjustProgress(-1)}
              aria-label="Decrease progress"
              className="shrink-0"
              style={{ ...mobileProgressBtnStyle, width: HEART_SIZE, height: HEART_SIZE }}
            >
              −
            </button>
          </div>
        )}
      </div>

      {reviewOpen && (
        <ReviewModal
          mediaId={animeId}
          title={title}
          initialReview={reviewDraft}
          onClose={() => setReviewOpen(false)}
          onSave={(review) => {
            setReviewDraft(review);
            onUpdate(animeId, { hasReview: true });
            setReviewOpen(false);
          }}
        />
      )}
    </div>
  );
}

const ACTIONS_GAP = 6; // matches AnimeCardActions gap-1.5
const HEART_SIZE = 24; // iconSize="sm"
// ACTIONS_ROW_WIDTH = LIST_STATUS_BUTTON_WIDTH (88) + gap (6) + heart (24) = 118 — used via w-[118px]

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
  padding: "8px",
  margin: "-8px",
  appearance: "none",
  WebkitAppearance: "none",
};

const mobileProgressBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 2,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--fg-muted)",
  fontFamily: "var(--font-space-mono)",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  flexShrink: 0,
  appearance: "none",
  WebkitAppearance: "none",
};
