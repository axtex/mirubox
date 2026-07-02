"use client";

import { AnimeCardActions } from "@/components/anime/AnimeCardActions";

interface HeroArchiveButtonProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
}

export function HeroArchiveButton({ mediaId, mediaType }: HeroArchiveButtonProps) {
  return (
    <div className="w-full">
      <AnimeCardActions mediaId={mediaId} mediaType={mediaType} iconSize="md" />
    </div>
  );
}
