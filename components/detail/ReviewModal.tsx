"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

interface ReviewData {
  content: string;
  containsSpoilers: boolean;
}

interface ReviewModalProps {
  mediaId: number;
  title: string;
  initialReview: ReviewData | null;
  onClose: () => void;
  onSave: (review: ReviewData) => void;
}

const MAX_LENGTH = 1000;
const TITLE_TRUNCATE_LENGTH = 30;

export function ReviewModal({ mediaId, title, initialReview, onClose, onSave }: ReviewModalProps) {
  const [content, setContent] = useState(initialReview?.content ?? "");
  const [containsSpoilers, setContainsSpoilers] = useState(initialReview?.containsSpoilers ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = [
          closeRef.current,
          textareaRef.current,
          checkboxRef.current,
          cancelRef.current,
          saveRef.current,
        ].filter((el): el is HTMLTextAreaElement | HTMLInputElement | HTMLButtonElement => el !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, content: trimmed, containsSpoilers }),
      });
      if (!res.ok) {
        setError("Failed to save. Try again.");
        return;
      }
      onSave({ content: trimmed, containsSpoilers });
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDismiss(e?: MouseEvent) {
    e?.stopPropagation();
    onClose();
  }

  const displayTitle = title.length > TITLE_TRUNCATE_LENGTH ? `${title.slice(0, TITLE_TRUNCATE_LENGTH)}…` : title;
  const isEmpty = content.trim().length === 0;
  const countColor =
    content.length >= MAX_LENGTH ? "var(--primary)" : content.length >= 900 ? "var(--warning)" : "var(--fg-faint)";

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleDismiss();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} review`}
        className="review-modal-shell"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          width: "calc(100% - 32px)",
          maxWidth: 400,
          padding: 16,
          position: "relative",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 12 }}>
          <span
            title={title}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              flex: 1,
            }}
          >
            {displayTitle}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="review-modal-close"
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Share your thoughts..."
          maxLength={MAX_LENGTH}
          aria-label="Write your review"
          className="review-modal-textarea resize-y"
          style={{
            width: "100%",
            minHeight: 88,
            maxHeight: 200,
            background: "var(--bg-surface)",
            border: "1px solid",
            borderRadius: 2,
            padding: "10px 12px",
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--fg)",
            lineHeight: 1.6,
            outline: "none",
            display: "block",
            marginBottom: error ? 6 : 10,
          }}
        />

        {error && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--primary)",
              marginBottom: 10,
            }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between" style={{ gap: 10 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <label className="flex items-center" style={{ gap: 5, cursor: "pointer", userSelect: "none" }}>
              <input
                ref={checkboxRef}
                type="checkbox"
                checked={containsSpoilers}
                onChange={(e) => setContainsSpoilers(e.target.checked)}
                className="review-modal-checkbox-input sr-only"
              />
              <span
                aria-hidden="true"
                className="review-modal-checkbox flex items-center justify-center"
                style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0 }}
              >
                {containsSpoilers && (
                  <span style={{ fontSize: 8, color: "var(--fg)", fontWeight: 700, lineHeight: 1 }}>✓</span>
                )}
              </span>
              <span
                className="review-modal-spoiler-label"
                style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, letterSpacing: "0.06em" }}
              >
                SPOILERS
              </span>
            </label>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: countColor }}>
              {content.length} / {MAX_LENGTH}
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              ref={cancelRef}
              type="button"
              onClick={handleDismiss}
              className="review-modal-cancel"
            >
              CANCEL
            </button>
            <button
              ref={saveRef}
              type="button"
              onClick={() => void handleSave()}
              disabled={isEmpty || saving}
              className="review-modal-save"
            >
              {saving ? "SAVING…" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
