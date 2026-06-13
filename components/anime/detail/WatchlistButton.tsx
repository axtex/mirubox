"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const STATUSES = [
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DROPPED", label: "Dropped" },
] as const;

interface WatchlistButtonProps {
  animeId: number;
  initialStatus: string | null;
  isLoggedIn: boolean;
}

export function WatchlistButton({
  animeId,
  initialStatus,
  isLoggedIn,
}: WatchlistButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <a
        href="/auth/signin"
        className="btn-ghost"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        Sign in to track
      </a>
    );
  }

  async function handleSelect(value: string) {
    setLoading(true);
    setOpen(false);
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, status: value }),
      });
      setStatus(value);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setOpen(false);
    try {
      await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId }),
      });
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  const currentLabel =
    STATUSES.find((s) => s.value === status)?.label ?? "Add to Watchlist";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="btn-primary gap-2"
        style={status ? { background: "var(--bg-card)", border: "1px solid var(--accent)", color: "var(--accent)" } : {}}
      >
        {status && <Check className="w-4 h-4" />}
        {loading ? "Saving…" : currentLabel}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-12 w-48 rounded-lg overflow-hidden z-20"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{
                color: status === value ? "var(--accent)" : "var(--fg-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              {status === value && <Check className="w-3 h-3 shrink-0" />}
              {label}
            </button>
          ))}
          {status && (
            <button
              onClick={handleRemove}
              className="w-full text-left px-4 py-2.5 text-sm border-t transition-colors"
              style={{ color: "var(--danger)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
