"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const MONO = "var(--font-space-mono)";

interface Props {
  initialDisplayName: string;
  username: string | null;
  email: string | null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: "var(--fg-subtle)",
          letterSpacing: "0.08em",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--fg-subtle)", marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function fieldStyle(editable: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: editable ? "var(--bg-surface)" : "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "8px 10px",
    fontFamily: "var(--font-geist)",
    fontSize: 13,
    color: editable ? "var(--fg)" : "var(--fg-subtle)",
    outline: "none",
  };
}

export function AccountSettingsForm({
  initialDisplayName,
  username,
  email,
}: Props): React.JSX.Element {
  const { update } = useSession();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [savedName, setSavedName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = displayName.trim() !== savedName;
  const canSave = dirty && displayName.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!res.ok) {
        setError("Failed to save. Try again.");
        return;
      }
      const trimmed = displayName.trim();
      setSavedName(trimmed);
      await update({ displayName: trimmed });
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Field label="DISPLAY NAME">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          style={fieldStyle(true)}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--fg-faint)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        {error && (
          <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--primary)", marginTop: 5 }}>
            {error}
          </p>
        )}
        {dirty && (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            style={{
              marginTop: 8,
              border: "none",
              borderRadius: 2,
              padding: "7px 14px",
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              background: canSave ? "var(--primary)" : "var(--bg-card-high)",
              color: canSave ? "#fff" : "var(--fg-subtle)",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "SAVING…" : "SAVE"}
          </button>
        )}
      </Field>

      <Field label="USERNAME" hint="Username editing coming soon.">
        <input
          type="text"
          value={username ?? ""}
          placeholder="Not set"
          disabled
          readOnly
          style={fieldStyle(false)}
        />
      </Field>

      <Field label="EMAIL" hint="Email editing coming soon.">
        <input
          type="email"
          value={email ?? ""}
          disabled
          readOnly
          style={fieldStyle(false)}
        />
      </Field>
    </>
  );
}
