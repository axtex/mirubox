"use client";

import { useRouter } from "next/navigation";
import { Heart, Check } from "lucide-react";
import { useArchive, isTrackedEntry } from "@/lib/archive-context";

interface HeroArchiveButtonProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
}

export function HeroArchiveButton({ mediaId, mediaType }: HeroArchiveButtonProps) {
  const router = useRouter();
  const { isLoggedIn, archiveMap, favouriteIds, addToArchive, removeFromArchive, toggleFavourite } =
    useArchive();

  const entry = archiveMap.get(mediaId) ?? null;
  const isTracked = isTrackedEntry(entry);
  const isFavourite = favouriteIds.has(mediaId);

  async function handleArchive() {
    if (!isLoggedIn) { router.push("/auth/signin"); return; }
    if (isTracked) {
      await removeFromArchive(mediaId);
    } else {
      await addToArchive(mediaId, mediaType, "PLANNED");
    }
  }

  async function handleHeart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/auth/signin"); return; }
    await toggleFavourite(mediaId, mediaType);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void handleArchive()}
        className="btn-primary"
        style={
          isTracked
            ? {
                background: "rgba(29,158,117,0.15)",
                border: "1px solid rgba(29,158,117,0.4)",
                color: "#1d9e75",
              }
            : {}
        }
      >
        {isTracked ? (
          <>
            <Check size={12} />
            IN ARCHIVE
          </>
        ) : (
          "+ ADD TO ARCHIVE"
        )}
      </button>

      <button
        type="button"
        onClick={(e) => void handleHeart(e)}
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        style={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
          background: isFavourite ? "rgba(232,23,63,0.15)" : "rgba(255,255,255,0.06)",
          border: isFavourite ? "1px solid rgba(232,23,63,0.4)" : "1px solid rgba(255,255,255,0.12)",
          color: isFavourite ? "#e8173f" : "#9e9ea8",
        }}
      >
        <Heart
          size={14}
          fill={isFavourite ? "#e8173f" : "none"}
          stroke={isFavourite ? "#e8173f" : "currentColor"}
          style={{ transition: "fill 0.15s ease, stroke 0.15s ease" }}
        />
      </button>
    </div>
  );
}
