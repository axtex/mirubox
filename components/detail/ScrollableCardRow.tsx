"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ScrollCardItem {
  id: number;
  image: string | null;
  name: string;
  subLine: string;
}

interface ScrollableCardRowProps {
  title: string;
  subtitle?: string;
  items: ScrollCardItem[];
  cardWidth?: number;
}

const GAP = 8;
const IMG_H = 96;

/** AniList serves default.jpg when a character/staff has no photo. */
function hasRealImage(url: string | null): url is string {
  if (!url) return false;
  return !/\/default\.jpg(?:\?|$)/i.test(url);
}

function Card({ item, cardWidth }: { item: ScrollCardItem; cardWidth: number }) {
  const image = hasRealImage(item.image) ? item.image : null;

  return (
    <div className="flex flex-col shrink-0" style={{ width: cardWidth }}>
      <div
        className="relative overflow-hidden"
        style={{
          width: cardWidth,
          height: IMG_H,
          borderRadius: 2,
          border: "1px solid var(--bg-card)",
          marginBottom: 4,
          background: "var(--bg-elevated)",
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={item.name}
            fill
            sizes={`${cardWidth}px`}
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center px-1"
            style={{ background: "var(--primary-dim)" }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.35,
                color: "color-mix(in srgb, var(--primary) 55%, var(--fg-muted))",
              }}
            >
              no image
            </span>
          </div>
        )}
      </div>
      <p
        className="truncate"
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: "var(--fg)",
          maxWidth: cardWidth,
          marginBottom: 1,
        }}
      >
        {item.name}
      </p>
      <p
        className="truncate"
        style={{
          fontSize: 8,
          fontFamily: "var(--font-space-mono)",
          color: "var(--fg-subtle)",
          maxWidth: cardWidth,
        }}
      >
        {item.subLine}
      </p>
    </div>
  );
}

export function ScrollableCardRow({ title, subtitle, items, cardWidth = 70 }: ScrollableCardRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = useCallback((): void => {
    const el = containerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [updateEdges, items.length]);

  if (items.length === 0) return null;

  const scrollByPage = (dir: 1 | -1): void => {
    const el = containerRef.current;
    if (!el) return;
    const cardsPerPage = Math.max(1, Math.floor(el.clientWidth / (cardWidth + GAP)));
    el.scrollBy({ left: dir * (cardWidth + GAP) * cardsPerPage, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div className="flex items-baseline">
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#5a5a65",
            }}
          >
            {title}
          </p>
          {subtitle && (
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                fontWeight: 400,
                color: "#3a3a45",
                marginLeft: 6,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>

        <div className="hidden md:flex" style={{ gap: 4 }}>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label="Scroll left"
            className="scroll-row-arrow"
          >
            <ChevronLeft size={12} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label="Scroll right"
            className="scroll-row-arrow"
          >
            <ChevronRight size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="relative">
        {!atEnd && (
          <div
            className="hidden md:block absolute pointer-events-none z-10"
            style={{
              right: 0,
              top: 0,
              bottom: 0,
              width: 40,
              background: "linear-gradient(to right, transparent, #131316)",
            }}
          />
        )}
        <div
          ref={containerRef}
          className="no-scrollbar overflow-x-auto overflow-y-hidden"
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            overscrollBehaviorX: "contain",
          }}
        >
          <div className="flex" style={{ gap: GAP }}>
            {items.map((item) => (
              <Card key={item.id} item={item} cardWidth={cardWidth} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
