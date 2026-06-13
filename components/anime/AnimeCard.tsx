import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getDisplayTitle } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface AnimeCardProps {
  anime: AnimeCardType;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

const SIZES = {
  sm: { width: 120, height: 170 },
  md: { width: 160, height: 225 },
  lg: { width: 200, height: 285 },
};

function scoreClass(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function AnimeCard({ anime, size = "md", showScore = true }: AnimeCardProps) {
  const { width, height } = SIZES[size];
  const title = getDisplayTitle(anime.title);
  const score = anime.averageScore;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group relative block overflow-hidden card-base card-hover"
      style={{ width, flexShrink: 0 }}
    >
      {/* Cover image */}
      <div className="relative overflow-hidden" style={{ height, width }}>
        {anime.coverImage.extraLarge || anime.coverImage.large ? (
          <Image
            src={(anime.coverImage.extraLarge ?? anime.coverImage.large)!}
            alt={title}
            fill
            sizes={`${width}px`}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--bg-card)" }}
          >
            <span className="text-3xl opacity-20">✦</span>
          </div>
        )}

        {/* Score badge */}
        {showScore && score !== null && (
          <div className="absolute top-2 right-2">
            <span className={`score-badge ${scoreClass(score)}`}>
              {score}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background:
              "linear-gradient(to top, rgba(13,13,18,0.95) 0%, rgba(13,13,18,0.4) 60%, transparent 100%)",
          }}
        >
          <p
            className="text-xs font-semibold leading-snug mb-2 line-clamp-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            {title}
          </p>
          <div
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md w-full justify-center"
            style={{
              background: "var(--accent)",
              color: "#fff",
              minHeight: "32px",
            }}
          >
            <Plus className="w-3 h-3" />
            View Details
          </div>
        </div>
      </div>

      {/* Below image */}
      <div className="px-2 py-2">
        <p
          className="text-xs font-medium truncate leading-snug"
          style={{ color: "var(--fg-muted)" }}
        >
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {anime.format && (
            <span className="badge" style={{ fontSize: "10px", padding: "1px 5px" }}>
              {anime.format.replace("_", " ")}
            </span>
          )}
          {anime.seasonYear && (
            <span
              className="text-[10px]"
              style={{
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {anime.seasonYear}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
