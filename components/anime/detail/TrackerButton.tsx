"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { notifySeasonChallengeSync, type ContinueStripSeasonChallenge } from "@/lib/season-challenge-client";

const STATUSES = [
  { value: "PLANNED",     label: "PLANNED",     dot: "#e4e1e6" },
  { value: "IN_PROGRESS", label: "IN PROGRESS", dot: "#3b82f6" },
  { value: "COMPLETED",   label: "COMPLETED",   dot: "#4ade80" },
  { value: "ON_HOLD",     label: "ON HOLD",     dot: "#fbbf24" },
  { value: "DROPPED",     label: "DROPPED",     dot: "#e61e2a" },
] as const;

interface TrackerButtonProps {
  animeId: number;
  initialStatus: string | null;
  isLoggedIn: boolean;
}

export function TrackerButton({ animeId, initialStatus, isLoggedIn }: TrackerButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isLoggedIn) {
    return (
      <a href="/auth/signin" className="btn-ghost w-full justify-center">
        SIGN IN TO TRACK
      </a>
    );
  }

  async function handleSelect(value: string) {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, status: value, mediaType: "ANIME" }),
      });
      if (!res.ok) throw new Error("Failed to update tracker");
      const data = (await res.json()) as {
        seasonChallengeJustEarned?: boolean;
        seasonChallenge?: ContinueStripSeasonChallenge | null;
      };
      setStatus(value);
      notifySeasonChallengeSync({
        justEarned: data.seasonChallengeJustEarned,
        challenge: data.seasonChallenge ?? undefined,
      });
    } catch {
      showToast({ type: "ERROR", title: "Something went wrong", body: "Please try again" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/api/tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId }),
      });
      if (!res.ok) throw new Error("Failed to remove from tracker");
      setStatus(null);
      notifySeasonChallengeSync();
    } catch {
      showToast({ type: "ERROR", title: "Something went wrong", body: "Please try again" });
    } finally {
      setLoading(false);
    }
  }

  const current = STATUSES.find((s) => s.value === status);
  const label = current?.label ?? "+ ADD TO TRACKER";

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center justify-between gap-2 w-full px-4 py-3"
        style={{
          background: status ? "var(--bg-card)" : "var(--primary)",
          border: `1px solid ${status ? "var(--primary)" : "transparent"}`,
          color: status ? "var(--primary)" : "#fff",
          borderRadius: 2,
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <div className="flex items-center gap-2">
          {current && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: current.dot }} />
          )}
          {loading ? "SAVING…" : label}
        </div>
        {status && <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 overflow-hidden z-30"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {STATUSES.map(({ value, label: lab, dot }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 transition-colors"
              style={{ color: status === value ? "var(--fg)" : "var(--fg-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
              <span className="text-label">{lab}</span>
              {status === value && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}
          {status && (
            <button
              onClick={handleRemove}
              className="w-full text-left px-4 py-2.5 text-label transition-colors"
              style={{ color: "var(--score-low)", borderTop: "1px solid var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              REMOVE
            </button>
          )}
        </div>
      )}
    </div>
  );
}
