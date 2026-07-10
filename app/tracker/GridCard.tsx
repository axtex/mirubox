"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimeCardActions } from "@/components/anime/AnimeCardActions";
import type { EntryData } from "./types";
import { trackerProgressPct } from "@/lib/tracker-progress";

interface Props {
  entry: EntryData;
  onUpdate: (animeId: number, updates: Partial<EntryData>) => void;
  onRemove: (animeId: number) => void;
  onFavouriteChange?: (animeId: number, isFavourite: boolean) => void;
}

export function GridCard({ entry, onUpdate, onRemove, onFavouriteChange }: Props) {
  const { animeId, anime, status, mediaType, progress } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const isManga = mediaType === "MANGA";
  const href = isManga ? `/manga/${animeId}` : `/anime/${animeId}`;
  const total = entry.total ?? (isManga ? anime.chapters : anime.episodes);
  const progressPct = trackerProgressPct(progress, total, isManga ? "MANGA" : "ANIME");

  return (
    <div
      className="anime-card group relative min-w-0"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 15vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`View ${title}`} />

        {/* Action bar — always visible on poster, same position as homepage */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[3]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            padding: "20px 7px 7px",
          }}
        >
          <AnimeCardActions
            mediaId={animeId}
            mediaType={mediaType}
            iconSize="sm"
            opaque
            onTrackerChange={(nextStatus) => {
              if (nextStatus === null) onRemove(animeId);
              else onUpdate(animeId, { status: nextStatus });
            }}
            onFavouriteChange={(isFavourite) => onFavouriteChange?.(animeId, isFavourite)}
          />
        </div>

        {status === "IN_PROGRESS" && progress > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
            style={{ height: 3, background: "rgba(0,0,0,0.45)" }}
          >
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "6px 8px 8px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--fg)",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </p>
        {(anime.format || anime.seasonYear) && (
          <p
            style={{
              fontSize: 10,
              color: "var(--fg-subtle)",
              fontFamily: "var(--font-space-mono)",
              marginTop: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
