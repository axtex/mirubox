"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function Card({ item, cardWidth }: { item: ScrollCardItem; cardWidth: number }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: cardWidth }}>
      <div
        className="relative overflow-hidden"
        style={{
          width: cardWidth,
          height: IMG_H,
          borderRadius: 2,
          border: "1px solid #1f1f22",
          marginBottom: 4,
        }}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes={`${cardWidth}px`}
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#1b1b1e" }}
          >
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#3a3a45" }}>
              {getInitial(item.name)}
            </span>
          </div>
        )}
      </div>
      <p
        className="truncate"
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: "#e4e1e6",
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
          color: "#5a5a65",
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
  const [offset, setOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  const totalWidth = items.length * (cardWidth + GAP) - GAP;
  const maxOffset = Math.max(0, totalWidth - containerWidth);
  const cardsPerPage = Math.max(1, Math.floor(containerWidth / (cardWidth + GAP)));
  const scrollAmount = (cardWidth + GAP) * cardsPerPage;

  const clampedOffset = Math.min(offset, maxOffset);
  const atStart = clampedOffset <= 0;
  const atEnd = clampedOffset >= maxOffset;

  const handlePrev = () => setOffset((o) => Math.max(0, o - scrollAmount));
  const handleNext = () => setOffset((o) => Math.min(maxOffset, o + scrollAmount));

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
            onClick={handlePrev}
            disabled={atStart}
            aria-label="Scroll left"
            className="scroll-row-arrow"
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={atEnd}
            aria-label="Scroll right"
            className="scroll-row-arrow"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-x-auto md:overflow-hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {!atEnd && (
          <div
            className="hidden md:block absolute pointer-events-none"
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
          className="flex md:transition-transform"
          style={{
            gap: GAP,
            transform: `translateX(-${clampedOffset}px)`,
            transitionDuration: "300ms",
            transitionTimingFunction: "ease",
          }}
        >
          {items.map((item) => (
            <Card key={item.id} item={item} cardWidth={cardWidth} />
          ))}
        </div>
      </div>
    </section>
  );
}
