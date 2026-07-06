"use client";

import { useState, useEffect } from "react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import type { DiscoverPick } from "@/lib/discover-picks";

interface AiPicksClientProps {
  picks: DiscoverPick[];
  maxItems?: number;
  onCountChange?: (count: number) => void;
}

const DEFAULT_MAX_ITEMS = 7;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiPicksClient({
  picks,
  maxItems = DEFAULT_MAX_ITEMS,
  onCountChange,
}: AiPicksClientProps) {
  const [visiblePicks, setVisiblePicks] = useState<DiscoverPick[] | null>(null);

  useEffect(() => {
    const shuffled = shuffle(picks);
    const seenIds = new Set<number>();
    const seenLabels = new Set<string>();
    const unique: DiscoverPick[] = [];

    for (const pick of shuffled) {
      if (seenIds.has(pick.anime.id) || seenLabels.has(pick.label)) continue;
      seenIds.add(pick.anime.id);
      seenLabels.add(pick.label);
      unique.push(pick);
      if (unique.length >= maxItems) break;
    }

    setVisiblePicks(unique);
    onCountChange?.(unique.length);
  }, [picks, maxItems, onCountChange]);

  if (!visiblePicks) {
    return (
      <>
        {Array.from({ length: maxItems }).map((_, i) => (
          <div key={i} className="discover-ai-cell">
            <span className="discover-vibe-label" aria-hidden="true">
              &nbsp;
            </span>
            <AnimeCardSkeleton size="md" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {visiblePicks.map(({ label, anime }) => (
        <div key={`${label}-${anime.id}`} className="discover-ai-cell">
          <span className="discover-vibe-label">{label}</span>
          <AnimeCard anime={anime} size="md" />
        </div>
      ))}
    </>
  );
}
