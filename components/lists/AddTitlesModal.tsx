"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type MediaType = "ANIME" | "MANGA";

interface SearchResult {
  id: number;
  title: string;
  coverImage: string | null;
  format: string | null;
  seasonYear: number | null;
  type: string;
}

export interface AddedTitle {
  id: number;
  title: string;
  coverImage: string | null;
  type: MediaType;
}

interface Props {
  slug: string;
  mediaType: MediaType;
  existingMediaIds: number[];
  onClose: () => void;
  onAdded: (title: AddedTitle) => void;
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

export function AddTitlesModal({
  slug,
  mediaType,
  existingMediaIds,
  onClose,
  onAdded,
}: Props): React.JSX.Element | null {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(() => new Set(existingMediaIds));
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

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/quick?q=${encodeURIComponent(trimmed)}&type=${mediaType}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mediaType]);

  async function addTitle(result: SearchResult) {
    if (addedIds.has(result.id) || addingId !== null) return;
    setAddingId(result.id);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${slug}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: result.id, mediaType }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not add title.");
        return;
      }
      setAddedIds((prev) => new Set(prev).add(result.id));
      onAdded({
        id: result.id,
        title: result.title,
        coverImage: result.coverImage,
        type: mediaType,
      });
    } catch {
      setError("Could not add title.");
    } finally {
      setAddingId(null);
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
        aria-label="Add titles"
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
            Add {mediaType === "MANGA" ? "manga" : "anime"}
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="review-modal-close">
            ×
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${mediaType.toLowerCase()}…`}
          autoFocus
          style={{ ...inputStyle, marginBottom: 0 }}
        />

        <div
          className="scrollbar-theme"
          style={{
            marginTop: 8,
            maxHeight: 280,
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: 2,
            minHeight: 120,
            colorScheme: "dark",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--fg-muted) var(--bg-card)",
          }}
        >
          {query.trim().length < 2 ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-subtle)",
                padding: "10px 12px",
              }}
            >
              Type at least 2 characters to search.
            </p>
          ) : searching && results.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-subtle)",
                padding: "10px 12px",
              }}
            >
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-subtle)",
                padding: "10px 12px",
              }}
            >
              No results.
            </p>
          ) : (
            results.map((r) => {
              const inList = addedIds.has(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={inList || addingId === r.id}
                  onClick={() => void addTitle(r)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: inList ? "default" : "pointer",
                    textAlign: "left",
                    opacity: inList ? 0.45 : 1,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 28,
                      height: 40,
                      flexShrink: 0,
                      background: "var(--bg-card)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {r.coverImage && (
                      <Image src={r.coverImage} alt="" fill sizes="28px" className="object-cover" />
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 11,
                      color: "var(--fg)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: inList ? "var(--fg-subtle)" : "var(--primary)",
                      letterSpacing: "0.06em",
                      flexShrink: 0,
                    }}
                  >
                    {inList ? "ADDED" : addingId === r.id ? "…" : "ADD"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--primary)",
              marginTop: 10,
            }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end" style={{ marginTop: 14 }}>
          <button type="button" onClick={onClose} className="review-modal-save">
            DONE
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
