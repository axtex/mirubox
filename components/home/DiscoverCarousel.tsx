"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AiPicksClient } from "@/components/home/AiPicksClient";
import type { DiscoverPick } from "@/lib/discover-picks";

const GAP = 12;
const COLS = 7;
const MOBILE_CARD_WIDTH = 140;
const MD_BREAKPOINT = 768;

function getCardWidth(containerWidth: number): number {
  if (containerWidth < MD_BREAKPOINT) {
    return MOBILE_CARD_WIDTH;
  }
  return (containerWidth - GAP * (COLS - 1)) / COLS;
}

interface DiscoverCarouselProps {
  picks: DiscoverPick[];
  maxItems?: number;
}

export function DiscoverCarousel({ picks, maxItems = 7 }: DiscoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const handleCountChange = useCallback((count: number) => {
    setItemCount(count);
    setOffset(0);
  }, []);

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

  const cardWidth = getCardWidth(containerWidth);
  const totalWidth = itemCount > 0 ? itemCount * (cardWidth + GAP) - GAP : 0;
  const maxOffset = Math.max(0, totalWidth - containerWidth);
  const cardsPerPage =
    containerWidth >= MD_BREAKPOINT
      ? COLS
      : Math.max(1, Math.floor(containerWidth / (MOBILE_CARD_WIDTH + GAP)));
  const scrollAmount = (cardWidth + GAP) * cardsPerPage;
  const canScroll = maxOffset > 0;

  const clampedOffset = Math.min(offset, maxOffset);
  const atStart = clampedOffset <= 0;
  const atEnd = clampedOffset >= maxOffset;

  useEffect(() => {
    setOffset((current) => Math.min(current, maxOffset));
  }, [maxOffset]);

  const handlePrev = () => setOffset((current) => Math.max(0, current - scrollAmount));
  const handleNext = () => setOffset((current) => Math.min(maxOffset, current + scrollAmount));

  return (
    <section className="min-w-0">
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">Discover</h2>
          {canScroll && (
            <div className="flex" style={{ gap: 4 }}>
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
          )}
        </div>
        <div className="section-underline" />
      </div>

      <div
        ref={containerRef}
        className="discover-scroll-track relative w-full min-w-0 overflow-hidden"
        style={{ "--discover-card-width": `${cardWidth}px` } as CSSProperties}
      >
        {!atEnd && canScroll && (
          <div
            className="absolute pointer-events-none"
            style={{
              right: 0,
              top: 0,
              bottom: 0,
              width: 40,
              background: "linear-gradient(to right, transparent, var(--bg))",
              zIndex: 1,
            }}
          />
        )}
        <div
          className="flex w-max flex-nowrap items-stretch transition-transform"
          style={{
            gap: GAP,
            transform: `translateX(-${clampedOffset}px)`,
            transitionDuration: "300ms",
            transitionTimingFunction: "ease",
          }}
        >
          <AiPicksClient
            picks={picks}
            maxItems={maxItems}
            onCountChange={handleCountChange}
          />
        </div>
      </div>
    </section>
  );
}
