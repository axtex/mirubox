"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Visibility = "public" | "private";

export default function NewListPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("List name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic: visibility === "public",
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const created = (await res.json()) as { slug: string };
      router.push(`/lists/${created.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1b1b1e",
    border: "1px solid #2a2a2d",
    borderRadius: 2,
    padding: "8px 12px",
    fontFamily: "var(--font-space-mono)",
    fontSize: 12,
    color: "var(--fg)",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="page-container py-8" style={{ maxWidth: 560 }}>
        <Link
          href="/lists"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            textDecoration: "none",
            letterSpacing: "0.06em",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← LISTS
        </Link>

        <h1
          className="text-headline-md font-display"
          style={{ marginBottom: 28, textTransform: "uppercase" }}
        >
          Create List
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Title */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              LIST NAME
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="e.g. My favourite isekai"
              maxLength={80}
              style={inputStyle}
            />
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-subtle)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {title.length}/80
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              DESCRIPTION <span style={{ color: "var(--fg-subtle)" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="What's this list about?"
              maxLength={300}
              style={{ ...inputStyle, height: 80, resize: "vertical" }}
            />
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-subtle)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {description.length}/300
            </p>
          </div>

          {/* Visibility toggle */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              VISIBILITY
            </label>
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
                      border: "1px solid #2a2a2d",
                      borderRadius: v === "public" ? "2px 0 0 2px" : "0 2px 2px 0",
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--fg-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      marginRight: v === "public" ? -1 : 0,
                    }}
                  >
                    {v.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--primary)",
              }}
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "CREATING..." : "CREATE LIST"}
            </button>
            <Link href="/lists" className="btn-ghost">
              CANCEL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
