"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Visibility = "public" | "private";

interface Props {
  slug: string;
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  onClose: () => void;
  onSaved: (next: { title: string; description: string; isPublic: boolean }) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-surface)",
  border: "1px solid var(--bg-card-high)",
  borderRadius: 2,
  padding: "8px 12px",
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "var(--fg)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "var(--fg-muted)",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

export function ListSettingsModal({
  slug,
  initialTitle,
  initialDescription,
  initialIsPublic,
  onClose,
  onSaved,
}: Props): React.JSX.Element | null {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<Visibility>(initialIsPublic ? "public" : "private");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    if (!title.trim()) {
      setError("List name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isPublic: visibility === "public",
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not save.");
        return;
      }
      onSaved({
        title: title.trim(),
        description: description.trim(),
        isPublic: visibility === "public",
      });
      router.refresh();
      onClose();
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not delete.");
        setDeleting(false);
        return;
      }
      router.push("/lists");
      router.refresh();
    } catch {
      setError("Could not delete.");
      setDeleting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
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
        colorScheme: "dark",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit list"
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
          colorScheme: "dark",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Edit list
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="review-modal-close">
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>LIST NAME</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              maxLength={80}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              DESCRIPTION <span style={{ color: "var(--fg-subtle)" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              maxLength={300}
              style={{ ...inputStyle, height: 80, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={labelStyle}>VISIBILITY</label>
            <div style={{ display: "flex", gap: 0 }}>
              {(["public", "private"] as Visibility[]).map((v) => {
                const active = visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      padding: "7px 16px",
                      border: "1px solid var(--bg-card-high)",
                      borderRadius: v === "public" ? "2px 0 0 2px" : "0 2px 2px 0",
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--fg-muted)",
                      cursor: "pointer",
                      marginRight: v === "public" ? -1 : 0,
                    }}
                  >
                    {v.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--primary)" }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between" style={{ gap: 8, paddingTop: 2 }}>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                letterSpacing: "0.06em",
                padding: "5px 10px",
                color: confirmDelete ? "#fff" : "var(--primary)",
                background: confirmDelete ? "var(--primary)" : "transparent",
                border: "1px solid var(--primary)",
                borderRadius: 2,
                cursor: deleting ? "default" : "pointer",
              }}
            >
              {deleting ? "DELETING…" : confirmDelete ? "CONFIRM DELETE" : "DELETE LIST"}
            </button>

            <div className="flex items-center" style={{ gap: 6 }}>
              <button type="button" onClick={onClose} className="review-modal-cancel">
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !title.trim()}
                className="review-modal-save"
              >
                {saving ? "SAVING…" : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
