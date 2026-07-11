"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ContinueCard, type ContinueItem } from "@/components/home/ContinueCard";

const GAP = 12;
const MIN_CARD_WIDTH = 180;
const MAX_VISIBLE = 4;

interface ContinueCardsRowProps {
  items: ContinueItem[];
}

function visibleCountForWidth(width: number, itemCount: number): number {
  if (width <= 0 || itemCount === 0) return 0;
  const slots = Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP));
  return Math.min(itemCount, MAX_VISIBLE, Math.max(1, slots));
}

export function ContinueCardsRow({ items }: ContinueCardsRowProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(items.length, MAX_VISIBLE),
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setVisibleCount(visibleCountForWidth(el.clientWidth, items.length));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  const count = Math.min(visibleCount, items.length);

  return (
    <div
      ref={containerRef}
      className="continue-cards"
      style={{ "--continue-count": count } as CSSProperties}
    >
      {items.slice(0, count).map((item) => (
        <ContinueCard key={item.id} item={item} />
      ))}
    </div>
  );
}
