"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDisplayTitle } from "@/lib/anilist";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";
import { AnimeCardActions } from "./AnimeCardActions";

interface AnimeCardProps {
  anime: AnimeCardType;
  size?: "sm" | "md" | "lg";
  watchlistStatus?: string | null;
  userRating?: number | null;
  similarity?: number | null;
}

const IMAGE_SIZES = {
  sm: "100px",
  md: "(min-width: 768px) 15vw, 140px",
  lg: "(min-width: 768px) 20vw, 180px",
};

const STATUS_DOT: Record<string, string> = {
  WATCHING: "#3b82f6",
  COMPLETED: "#4ade80",
  PLAN_TO_WATCH: "#e4e1e6",
  DROPPED: "#e61e2a",
  ON_HOLD: "#fbbf24",
};

export function AnimeCard({
  anime,
  size = "md",
  watchlistStatus,
  userRating,
  similarity,
}: AnimeCardProps) {
  const [status, setStatus] = useState<string | null>(watchlistStatus ?? null);
  const title = getDisplayTitle(anime.title);
  const score = anime.averageScore;
  const dotColor = status ? STATUS_DOT[status] : null;
  const detailHref = anime.type === "MANGA" ? `/manga/${anime.id}` : `/anime/${anime.id}`;

  return (
    <div
      tabIndex={0}
      className={`anime-card anime-card--${size} group relative overflow-hidden`}
      style={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="relative w-full aspect-[2/3]">
        {anime.coverImage.extraLarge || anime.coverImage.large ? (
          <Image
            src={(anime.coverImage.extraLarge ?? anime.coverImage.large)!}
            alt={title}
            fill
            sizes={IMAGE_SIZES[size]}
            className="object-cover"
            style={{ transition: "none" }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "var(--bg-card)" }}
          >
            <span style={{ fontSize: 24, opacity: 0.15 }}>✦</span>
          </div>
        )}

        <Link
          href={detailHref}
          className="absolute inset-0 z-[1]"
          aria-label={`View ${title}`}
        />

        {score !== null && (
          <div
            className="absolute top-1.5 right-1.5 z-[1] leading-none font-bold pointer-events-none"
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

        {dotColor && (
          <div
            className="absolute bottom-2 left-2 z-[1] w-2 h-2 rounded-full pointer-events-none"
            style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}` }}
          />
        )}

        <div
          className="absolute inset-0 z-10 flex flex-col justify-end opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200"
          style={{
            background:
              "linear-gradient(to top, rgba(15,15,18,0.97) 0%, rgba(15,15,18,0.65) 55%, transparent 100%)",
          }}
        >
          <Link
            href={detailHref}
            className="absolute inset-0"
            aria-label={`View ${title}`}
            tabIndex={-1}
          />
          <div className="relative p-2 pointer-events-none">
            <p
              className="text-[13px] font-medium leading-snug line-clamp-2 mb-1"
              style={{ fontFamily: "var(--font-anybody)", color: "var(--fg)" }}
            >
              {title}
            </p>

            {(anime.format || anime.seasonYear) && (
              <p
                className="mb-1"
                style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--fg-muted)" }}
              >
                {[anime.format?.replace(/_/g, " "), anime.seasonYear].filter(Boolean).join(" · ")}
              </p>
            )}

            {similarity != null && (
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--primary)" }}>
                {Math.round(similarity * 100)}% MATCH
              </p>
            )}

            <div className="pointer-events-auto relative z-10">
              <AnimeCardActions
                mediaId={anime.id}
                mediaType={anime.type}
                initialStatus={status}
                initialRating={userRating}
                onStatusChange={setStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
