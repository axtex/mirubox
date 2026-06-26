"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "./types";
import type { EntryData } from "./types";
import { trackerStatusDropdownTriggerStyle, TRACKER_BADGE } from "@/components/tracker/badgeStyles";

interface Props {
  entry: EntryData;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
}

export function GridCard({ entry, onUpdate, onRemove }: Props) {
  const { animeId, anime, status, mediaType, progress } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-subtle)";
  const isManga = mediaType === "MANGA";
  const href = isManga ? `/manga/${animeId}` : `/anime/${animeId}`;
  const total = entry.total ?? (isManga ? anime.chapters : anime.episodes);
  const progressPct = total ? Math.round((progress / total) * 100) : 0;

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) {
        setShowStatusPicker(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleStatusChange(newStatus: string) {
    setShowStatusPicker(false);
    onUpdate(animeId, { status: newStatus });
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, status: newStatus, progress }),
    });
  }

  async function handleRemove() {
    setShowStatusPicker(false);
    onRemove(animeId);
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId }),
    });
  }

  return (
    <div
      ref={cardRef}
      className={`group relative min-w-0${showStatusPicker ? " overflow-visible" : ""}`}
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div
        className={`relative aspect-[2/3]${showStatusPicker ? " overflow-visible" : " overflow-hidden"}`}
      >
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 15vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`View ${title}`} />

        <div
          className="absolute top-1.5 right-1.5 z-[3] flex items-center"
          style={{ gap: TRACKER_BADGE.gap }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Status: ${STATUS_LABELS[status] ?? status}. Change status or remove`}
            aria-expanded={showStatusPicker}
            aria-haspopup="menu"
            onClick={() => setShowStatusPicker((open) => !open)}
            style={{
              ...trackerStatusDropdownTriggerStyle,
              background: showStatusPicker ? "var(--bg-elevated)" : "rgba(15,15,18,0.72)",
              border: showStatusPicker ? "1px solid var(--border-bright)" : "1px solid rgba(255,255,255,0.12)",
              color: "var(--fg-subtle)",
            }}
          >
            <span
              className="block rounded-full shrink-0"
              style={{ width: TRACKER_BADGE.dotSize, height: TRACKER_BADGE.dotSize, background: dotColor }}
            />
            <ChevronDown
              size={TRACKER_BADGE.chevronSize}
              className="shrink-0"
              style={{
                transition: "transform 0.15s ease",
                transform: showStatusPicker ? "rotate(180deg)" : "none",
              }}
            />
          </button>
        </div>

        {showStatusPicker && (
          <div
            className="absolute z-30 py-0.5"
            role="menu"
            style={{
              left: 6,
              right: 6,
              top: 30,
              background: "var(--bg-card-high)",
              border: "1px solid var(--border-bright)",
              borderRadius: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(STATUS_LABELS)
              .filter(([k]) => k !== status)
              .map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="menuitem"
                  className="w-full flex items-center transition-colors"
                  style={gridMenuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  onClick={() => void handleStatusChange(k)}
                >
                  <span className="block rounded-full shrink-0" style={{ width: 5, height: 5, background: STATUS_COLORS[k] }} />
                  {label.toUpperCase()}
                </button>
              ))}
            <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
            <button
              type="button"
              role="menuitem"
              className="w-full flex items-center transition-colors"
              style={{ ...gridMenuItemStyle, color: "#e61e2a" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onClick={() => void handleRemove()}
            >
              REMOVE
            </button>
          </div>
        )}

        {status === "IN_PROGRESS" && total !== null && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
            style={{ height: 3, background: "rgba(0,0,0,0.45)" }}
          >
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "6px 8px 8px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--fg)",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </p>
        {(anime.format || anime.seasonYear) && (
          <p
            style={{
              fontSize: 10,
              color: "var(--fg-subtle)",
              fontFamily: "var(--font-space-mono)",
              marginTop: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

const gridMenuItemStyle: React.CSSProperties = {
  gap: 6,
  padding: "3px 8px",
  fontFamily: "var(--font-space-mono)",
  fontSize: 8,
  color: "var(--fg-muted)",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "0.04em",
  lineHeight: 1.2,
};
