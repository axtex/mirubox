"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const STATUSES = [
  { value: "PLANNED",     label: "PLANNED" },
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED",   label: "COMPLETED" },
  { value: "ON_HOLD",     label: "ON HOLD" },
  { value: "DROPPED",     label: "DROPPED" },
] as const;

interface MangaWatchlistButtonProps {
  animeId: number;
  initialStatus: string | null;
  isLoggedIn: boolean;
}

export function MangaWatchlistButton({ animeId, initialStatus, isLoggedIn }: MangaWatchlistButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <a href="/auth/signin" className="btn-primary w-full justify-center">
        SIGN IN TO TRACK
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
        body: JSON.stringify({ animeId, status: value, mediaType: "MANGA" }),
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
    STATUSES.find((s) => s.value === status)?.label ?? "+ ADD TO TRACKER";

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
              onClick={() => void handleSelect(value)}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{ color: status === value ? "var(--accent)" : "var(--fg-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              {status === value && <Check className="w-3 h-3 shrink-0" />}
              {label}
            </button>
          ))}
          {status && (
            <button
              onClick={() => void handleRemove()}
              className="w-full text-left px-4 py-2.5 text-sm border-t transition-colors"
              style={{ color: "var(--score-low)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
