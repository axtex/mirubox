"use client";

import { useState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";

interface ReviewInputProps {
  animeId: number;
  initialReview: { content: string; containsSpoilers: boolean } | null;
  isLoggedIn: boolean;
}

export function ReviewInput({ animeId, initialReview, isLoggedIn }: ReviewInputProps) {
  const [content, setContent] = useState(initialReview?.content ?? "");
  const [containsSpoilers, setContainsSpoilers] = useState(initialReview?.containsSpoilers ?? false);
  const [savedReview, setSavedReview] = useState(initialReview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) return null;

  const trimmedContent = content.trim();
  const hasReview = savedReview !== null;
  const hasChanges =
    trimmedContent !== savedReview?.content ||
    containsSpoilers !== (savedReview?.containsSpoilers ?? false);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, content: trimmed, containsSpoilers }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to save review");
        return;
      }
      setSavedReview({ content: trimmed, containsSpoilers });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading || !hasReview) return;
    if (!window.confirm("Delete your review?")) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId }),
      });
      if (!res.ok) {
        setError("Failed to delete review");
        return;
      }
      setContent("");
      setContainsSpoilers(false);
      setSavedReview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="review">
      <p className="text-label mb-3" style={{ color: "var(--fg-muted)" }}>
        YOUR REVIEW
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts…"
        rows={5}
        maxLength={10000}
        disabled={loading}
        className="w-full resize-y outline-none transition-colors"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--fg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-bright)",
          borderRadius: 2,
          padding: "12px 14px",
        }}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={containsSpoilers}
            onChange={(e) => setContainsSpoilers(e.target.checked)}
            disabled={loading}
            style={{ accentColor: "var(--primary)" }}
          />
          <span className="text-label" style={{ color: "var(--fg-muted)" }}>
            CONTAINS SPOILERS
          </span>
        </label>

        <div className="flex items-center gap-3">
          {error && (
            <StatusMessage as="span" variant="error">
              {error}
            </StatusMessage>
          )}
          {hasReview && !hasChanges && (
            <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
              SAVED
            </span>
          )}
          {hasReview && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={loading}
              className="text-label transition-colors"
              style={{
                color: "var(--fg-subtle)",
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                padding: 0,
              }}
            >
              DELETE
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || !trimmedContent || (hasReview && !hasChanges)}
            className="text-label transition-opacity"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              padding: "8px 16px",
              borderRadius: 2,
              border: "1px solid var(--primary)",
              background: hasReview && !hasChanges ? "transparent" : "var(--primary)",
              color: hasReview && !hasChanges ? "var(--fg-subtle)" : "#fff",
              cursor: loading || !trimmedContent || (hasReview && !hasChanges) ? "not-allowed" : "pointer",
              opacity: loading || !trimmedContent || (hasReview && !hasChanges) ? 0.5 : 1,
            }}
          >
            {loading ? "SAVING…" : hasReview ? "UPDATE" : "SAVE REVIEW"}
          </button>
        </div>
      </div>
    </section>
  );
}
