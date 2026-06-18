"use client";

import { useState, useEffect } from "react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import type { PoolData } from "@/lib/discover-picks";

interface AiPicksClientProps {
  pools: Record<string, PoolData>;
}

interface VibePick {
  label: string;
  anime: AnimeCardType;
}

const POOL_KEYS = ["A", "B", "C", "D", "E", "F", "G"] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AiPicksClient({ pools }: AiPicksClientProps) {
  const [picks, setPicks] = useState<VibePick[] | null>(null);

  useEffect(() => {
    const available = shuffle(POOL_KEYS.filter((k) => pools[k]));
    if (available.length === 0) return;

    // Build ordered list: one from each pool first, then 2nd/3rd extras
    const ordered: VibePick[] = [];
    for (const key of available) {
      ordered.push({ label: pools[key].label, anime: pools[key].anime[0] });
    }
    for (const key of available) {
      for (let i = 1; i < pools[key].anime.length; i++) {
        ordered.push({ label: pools[key].label, anime: pools[key].anime[i] });
      }
    }

    // One card per pool (7 total)
    setPicks(Array.from({ length: POOL_KEYS.length }, (_, i) => ordered[i % ordered.length]));
  }, [pools]);

  if (!picks) {
    return (
      <>
        {Array.from({ length: POOL_KEYS.length }).map((_, i) => (
          <AnimeCardSkeleton key={i} size="md" />
        ))}
      </>
    );
  }

  return (
    <>
      {picks.map(({ label, anime }) => (
        <div key={anime.id} className="discover-ai-cell">
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-subtle)",
              fontStyle: "italic",
              letterSpacing: "0.02em",
              display: "block",
            }}
          >
            {label}
          </span>
          <AnimeCard anime={anime} size="md" />
        </div>
      ))}
    </>
  );
}
