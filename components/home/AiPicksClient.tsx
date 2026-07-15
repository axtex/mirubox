"use client";

import { AnimeCard } from "@/components/anime/AnimeCard";
import type { DiscoverPick } from "@/lib/discover-picks";

interface AiPicksClientProps {
  picks: DiscoverPick[];
}

/** Renders server-selected Discover picks immediately — no hydration skeleton gate. */
export function AiPicksClient({ picks }: AiPicksClientProps) {
  return (
    <>
      {picks.map(({ label, anime }) => (
        <div key={`${label}-${anime.id}`} className="discover-ai-cell">
          <span className="discover-vibe-label">{label}</span>
          <AnimeCard anime={anime} size="md" />
        </div>
      ))}
    </>
  );
}
