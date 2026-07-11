"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { ProfileMedia } from "@/lib/profile-types";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import { StatusMessage } from "@/components/ui/StatusMessage";

const MAX_TOP = 3;

interface PoolMedia extends ProfileMedia {
  averageScore?: number | null;
}

interface PoolItem {
  mediaId: number;
  media: PoolMedia;
}

interface Top3PickerModalProps {
  type: "anime" | "manga";
  initialSelected: number[];
  onClose: () => void;
  onSaved: (slots: Array<{ mediaId: number; order: number; media: ProfileMedia }>) => void;
}

function toAnimeCard(media: PoolMedia): AnimeCardType {
  return {
    id: media.id,
    title: {
      romaji: media.title,
      english: media.titleEnglish,
      native: null,
    },
    coverImage: {
      large: media.coverImage,
      extraLarge: media.coverImage,
    },
    bannerImage: null,
    genres: [],
    episodes: media.episodes,
    chapters: media.chapters,
    status: null,
    season: null,
    seasonYear: media.seasonYear,
    averageScore: media.averageScore ?? null,
    popularity: null,
    format: media.format,
    type: media.type,
    tags: [],
    rankings: [],
  };
}

function toProfileMedia(media: PoolMedia): ProfileMedia {
  return {
    id: media.id,
    title: media.title,
    titleEnglish: media.titleEnglish,
    coverImage: media.coverImage,
    format: media.format,
    seasonYear: media.seasonYear,
    type: media.type,
    episodes: media.episodes,
    chapters: media.chapters,
  };
}

export function Top3PickerModal({
  type,
  initialSelected,
  onClose,
  onSaved,
}: Top3PickerModalProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [selected, setSelected] = useState<number[]>(initialSelected.slice(0, MAX_TOP));

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/me/favourites?type=${type}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as {
          pool: PoolItem[];
          selected: number[];
        };
        if (cancelled) return;
        setPool(data.pool);
        // Prefer server selection; fall back to what profile already shows
        setSelected(
          (data.selected.length > 0 ? data.selected : initialSelected).slice(
            0,
            MAX_TOP
          )
        );
      } catch {
        if (!cancelled) setError("Couldn’t load favourites.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // initialSelected is only used as fallback on first load for this type
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/type only
  }, [type]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function toggle(mediaId: number): void {
    setSelected((prev) => {
      const idx = prev.indexOf(mediaId);
      if (idx >= 0) return prev.filter((id) => id !== mediaId);
      if (prev.length >= MAX_TOP) return prev;
      return [...prev, mediaId];
    });
  }

  async function handleSave(): Promise<void> {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me/favourites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mediaIds: selected }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to save.");
        return;
      }
      const mediaById = new Map(pool.map((p) => [p.mediaId, p.media]));
      onSaved(
        selected.flatMap((mediaId, order) => {
          const media = mediaById.get(mediaId);
          if (!media) return [];
          return [{ mediaId, order, media: toProfileMedia(media) }];
        })
      );
      onClose();
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleDismiss(e?: MouseEvent): void {
    e?.stopPropagation();
    onClose();
  }

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
        aria-label={`Edit top 3 ${type}`}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          width: "calc(100% - 32px)",
          maxWidth: 480,
          maxHeight: "min(80vh, 560px)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          colorScheme: "dark",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "14px 16px 10px", gap: 12, flexShrink: 0 }}
        >
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
              letterSpacing: "0.04em",
              margin: 0,
              minWidth: 0,
              flex: 1,
            }}
          >
            Pick up to {MAX_TOP} from your favourites · {selected.length}/{MAX_TOP}
          </p>
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

        <div
          className="scrollbar-theme"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "4px 12px 12px 16px",
          }}
        >
          {loading ? (
            <StatusMessage block variant="faint" style={{ margin: "24px 0" }}>
              Loading…
            </StatusMessage>
          ) : pool.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 8px" }}>
              <StatusMessage block variant="muted" style={{ margin: "0 0 12px", lineHeight: 1.5, textTransform: "none", letterSpacing: "0.02em" }}>
                Heart {type} in Tracker first, then pick your Top 3 here.
              </StatusMessage>
              <Link
                href="/tracker?favourites=true"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--primary)",
                  textDecoration: "none",
                  letterSpacing: "0.06em",
                }}
              >
                GO TO FAVOURITES →
              </Link>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {pool.map((item) => {
                const rank = selected.indexOf(item.mediaId);
                const isSelected = rank >= 0;
                const atCap = selected.length >= MAX_TOP && !isSelected;

                return (
                  <AnimeCard
                    key={item.mediaId}
                    anime={toAnimeCard(item.media)}
                    size="md"
                    onSelect={() => toggle(item.mediaId)}
                    selectionRank={isSelected ? rank + 1 : null}
                    selectDisabled={atCap}
                  />
                );
              })}
            </div>
          )}
        </div>

        {error ? (
          <StatusMessage variant="error" style={{ margin: "0 16px 8px" }}>
            {error}
          </StatusMessage>
        ) : null}

        <div
          className="flex items-center justify-end"
          style={{
            gap: 8,
            padding: "10px 16px 14px",
            borderTop: "1px solid var(--bg-card)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
              background: "transparent",
              border: "1px solid var(--bg-card-high)",
              borderRadius: 2,
              padding: "7px 12px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              fontWeight: 600,
              color: "#fff",
              background: "var(--primary)",
              border: "none",
              borderRadius: 2,
              padding: "7px 14px",
              cursor: saving || loading ? "not-allowed" : "pointer",
              letterSpacing: "0.06em",
              opacity: saving || loading ? 0.6 : 1,
            }}
          >
            {saving ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
