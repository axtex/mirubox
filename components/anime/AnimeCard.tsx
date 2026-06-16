import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getDisplayTitle } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface AnimeCardProps {
  anime: AnimeCardType;
  size?: "sm" | "md" | "lg";
  watchlistStatus?: string | null;
  similarity?: number | null;
}

const SIZES = {
  sm: { width: 100, height: 150 },
  md: { width: 140, height: 210 },
  lg: { width: 180, height: 270 },
};

const STATUS_DOT: Record<string, string> = {
  WATCHING:      "#3b82f6",
  COMPLETED:     "#4ade80",
  PLAN_TO_WATCH: "#e4e1e6",
  DROPPED:       "#e61e2a",
  ON_HOLD:       "#fbbf24",
};

export function AnimeCard({ anime, size = "md", watchlistStatus, similarity }: AnimeCardProps) {
  const { width, height } = SIZES[size];
  const title = getDisplayTitle(anime.title);
  const score = anime.averageScore;
  const dotColor = watchlistStatus ? STATUS_DOT[watchlistStatus] : null;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="anime-card group relative block overflow-hidden"
      style={{
        width,
        flexShrink: 0,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "block",
      }}
    >
      {/* Poster — full card height */}
      <div className="relative" style={{ height, width }}>
        {anime.coverImage.extraLarge || anime.coverImage.large ? (
          <Image
            src={(anime.coverImage.extraLarge ?? anime.coverImage.large)!}
            alt={title}
            fill
            sizes={`${width}px`}
            className="object-cover"
            style={{ transition: "none" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--bg-card)" }}
          >
            <span style={{ fontSize: 24, opacity: 0.15 }}>✦</span>
          </div>
        )}

        {/* Score pill — top right, crimson */}
        {score !== null && (
          <div
            className="absolute top-1.5 right-1.5 leading-none font-bold"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 2,
              padding: "2px 5px",
            }}
          >
            {(score / 10).toFixed(1)}
          </div>
        )}

        {/* Watchlist status dot — bottom left */}
        {dotColor && (
          <div
            className="absolute bottom-2 left-2 w-2 h-2 rounded-full"
            style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}` }}
          />
        )}

        {/* Hover overlay — gradient + text reveal */}
        <div
          className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to top, rgba(15,15,18,0.97) 0%, rgba(15,15,18,0.65) 55%, transparent 100%)",
          }}
        >
          <div className="p-2 flex flex-col gap-1.5">
            <p
              className="text-[13px] font-medium leading-snug line-clamp-2"
              style={{ fontFamily: "var(--font-anybody)", color: "var(--fg)" }}
            >
              {title}
            </p>

            {(anime.format || anime.seasonYear) && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}>
                {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ")}
              </p>
            )}

            {similarity != null && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--primary)" }}>
                {Math.round(similarity * 100)}% MATCH
              </p>
            )}

            <div
              className="flex items-center justify-center gap-1 py-1.5"
              style={{
                background: "var(--primary)",
                color: "#fff",
                borderRadius: 2,
                fontSize: 9,
                fontFamily: "var(--font-space-mono)",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              <Plus className="w-2.5 h-2.5" />
              WATCHLIST
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
