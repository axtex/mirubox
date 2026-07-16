"use client";

import { useState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";

const MONO = "var(--font-space-mono)";

interface Props {
  initialValue: boolean;
}

export function EpisodeNotificationsToggle({
  initialValue,
}: Props): React.JSX.Element {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle(): Promise<void> {
    if (saving) return;
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeNotifications: next }),
      });
      if (!res.ok) {
        setEnabled(!next);
        setError("Failed to save. Try again.");
      }
    } catch {
      setEnabled(!next);
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4">
      <p
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: "var(--fg-subtle)",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        EPISODE NOTIFICATIONS
      </p>
      <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--fg-subtle)", marginBottom: 8 }}>
        In-app alerts when a new episode drops for titles you&apos;re watching.
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Episode notifications"
        disabled={saving}
        onClick={() => void handleToggle()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          padding: 0,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 36,
            height: 20,
            borderRadius: 2,
            background: enabled ? "var(--primary)" : "var(--bg-card-high)",
            border: `1px solid ${enabled ? "var(--primary)" : "var(--border)"}`,
            position: "relative",
            transition: "background 120ms, border-color 120ms",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: enabled ? 18 : 2,
              width: 14,
              height: 14,
              borderRadius: 1,
              background: enabled ? "#fff" : "var(--fg-subtle)",
              transition: "left 120ms",
            }}
          />
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--fg)" }}>
          {enabled ? "On" : "Off"}
        </span>
      </button>
      {error && (
        <StatusMessage variant="error" style={{ marginTop: 5 }}>
          {error}
        </StatusMessage>
      )}
    </div>
  );
}
