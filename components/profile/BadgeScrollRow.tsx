"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BadgeDisplay } from "@/lib/profile-types";

interface BadgeScrollRowProps {
  badges: BadgeDisplay[];
}

export function BadgeScrollRow({ badges }: BadgeScrollRowProps): React.JSX.Element {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback((): void => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, badges.length]);

  function scrollByItems(dir: 1 | -1): void {
    const el = scrollerRef.current;
    if (!el) return;
    // 42px circle + 12px gap ≈ 54px per item × 3
    el.scrollBy({ left: dir * 54 * 3, behavior: "smooth" });
  }

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-card)",
        borderRadius: 2,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "var(--fg-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          BADGES
        </p>
        <div className="hidden md:flex" style={{ gap: 4 }}>
          <button
            type="button"
            aria-label="Scroll badges left"
            disabled={atStart}
            onClick={() => scrollByItems(-1)}
            className="scroll-row-arrow"
          >
            <ChevronLeft size={12} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Scroll badges right"
            disabled={atEnd}
            onClick={() => scrollByItems(1)}
            className="scroll-row-arrow"
          >
            <ChevronRight size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div
          ref={scrollerRef}
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="no-scrollbar"
        >
          {badges.map((badge) => (
            <div
              key={badge.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: badge.earned
                    ? "rgba(232,23,63,0.1)"
                    : "var(--bg-elevated)",
                  border: badge.earned
                    ? "1.5px solid rgba(232,23,63,0.4)"
                    : "1px solid var(--bg-card-high)",
                  fontSize: badge.earned ? 16 : 12,
                  color: badge.earned ? undefined : "var(--fg-faint)",
                }}
              >
                {badge.earned ? badge.emoji : "🔒"}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 8,
                  textAlign: "center",
                  maxWidth: 52,
                  lineHeight: 1.3,
                  color: badge.earned ? "var(--fg-muted)" : "var(--fg-faint)",
                }}
              >
                {badge.name}
              </span>
            </div>
          ))}
        </div>
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 28,
            pointerEvents: "none",
            background: "linear-gradient(to right, transparent, var(--bg-surface))",
          }}
        />
      </div>
    </div>
  );
}
