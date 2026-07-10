"use client";

import { AnimeCardActions } from "@/components/anime/AnimeCardActions";

interface HeroTrackerButtonProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
}

export function HeroTrackerButton({ mediaId, mediaType }: HeroTrackerButtonProps) {
  return (
    <div className="w-full">
      <AnimeCardActions mediaId={mediaId} mediaType={mediaType} iconSize="md" />
    </div>
  );
}
