"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ANIME_STATUSES = [
  { value: "PLAN_TO_WATCH", label: "PLAN TO WATCH", dot: "#e4e1e6" },
  { value: "WATCHING",      label: "WATCHING",       dot: "#3b82f6" },
  { value: "COMPLETED",     label: "COMPLETED",      dot: "#4ade80" },
  { value: "ON_HOLD",       label: "ON HOLD",        dot: "#fbbf24" },
  { value: "DROPPED",       label: "DROPPED",        dot: "#e61e2a" },
];

const MANGA_STATUSES = [
  { value: "PLAN_TO_READ", label: "PLAN TO READ", dot: "#e4e1e6" },
  { value: "READING",      label: "READING",      dot: "#3b82f6" },
  { value: "COMPLETED",    label: "COMPLETED",    dot: "#4ade80" },
  { value: "ON_HOLD",      label: "ON HOLD",      dot: "#fbbf24" },
  { value: "DROPPED",      label: "DROPPED",      dot: "#e61e2a" },
];

interface TrackerStatusBarProps {
  animeId: number;
  initialStatus: string;
  initialRating: number | null;
  mediaType: "ANIME" | "MANGA";
}

export function TrackerStatusBar({
  animeId,
  initialStatus,
  initialRating,
  mediaType,
}: TrackerStatusBarProps) {
  const [status, setStatus] = useState(initialStatus);
  const [rating, setRating] = useState(initialRating);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const statuses = mediaType === "MANGA" ? MANGA_STATUSES : ANIME_STATUSES;
  const current = statuses.find((s) => s.value === status);

  useEffect(() => {
    if (!expanded) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, status: newStatus }),
      });
      setStatus(newStatus);
    } finally {
      setSaving(false);
    }
  }

  async function handleRating(score: number) {
    const next = rating === score ? null : score;
    setSaving(true);
    try {
      if (next === null) {
        await fetch("/api/ratings", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId }),
        });
      } else {
        await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId, score: next }),
        });
      }
      setRating(next);
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = current?.label ?? status.replace(/_/g, " ");
  const barText = rating ? `${statusLabel} · ★ ${rating}` : statusLabel;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-bright)",
          borderRadius: 2,
          cursor: "pointer",
          transition: "background 0.15s ease",
        }}
      >
        <div className="flex items-center gap-3">
          {current && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: current.dot }}
            />
          )}
          <span className="text-label" style={{ color: "var(--fg-muted)" }}>
            {saving ? "SAVING…" : barText}
          </span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "var(--fg-subtle)", transition: "transform 0.15s ease", transform: expanded ? "rotate(180deg)" : "none" }}
        />
      </button>

      {expanded && (
        <div
          className="mt-1 p-4 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div>
            <p className="text-label mb-2.5" style={{ color: "var(--fg-subtle)" }}>
              STATUS
            </p>
            <div className="flex flex-wrap gap-2">
              {statuses.map(({ value, label, dot }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className="flex items-center gap-2 px-3 py-1.5 transition-colors"
                  style={{
                    background:
                      status === value ? "var(--primary-dim)" : "var(--bg-elevated)",
                    border: `1px solid ${status === value ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 2,
                    color: status === value ? "var(--fg)" : "var(--fg-muted)",
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: dot }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-label mb-2.5" style={{ color: "var(--fg-subtle)" }}>
              YOUR RATING
            </p>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => handleRating(n)}
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: 28,
                    height: 28,
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 2,
                    border: `1px solid ${rating !== null && n <= rating ? "var(--primary)" : "var(--border)"}`,
                    background:
                      rating !== null && n <= rating
                        ? "var(--primary)"
                        : "var(--bg-elevated)",
                    color:
                      rating !== null && n <= rating ? "#fff" : "var(--fg-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
