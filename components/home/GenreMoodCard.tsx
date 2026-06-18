"use client";

import { useState } from "react";
import Link from "next/link";
import type { GenreTile } from "@/lib/discover-picks";

export function GenreMoodCard({ tile }: { tile: GenreTile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={tile.href}
      className="anime-card anime-card--md group relative overflow-hidden block"
      style={{
        borderRadius: 4,
        border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
        transform: hovered ? "scale(1.03)" : "scale(1)",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Same aspect ratio as anime poster */}
      <div className="w-full aspect-[2/3] relative flex flex-col items-center justify-center p-4"
        style={{ background: "var(--bg-card-high)" }}
      >
        {/* Tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: tile.tint }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <p
            style={{
              fontFamily: "var(--font-anybody)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--fg)",
              lineHeight: 1.2,
            }}
          >
            {tile.genre.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-muted)",
              lineHeight: 1.4,
              letterSpacing: "0.04em",
            }}
          >
            {tile.descriptor}
          </p>
        </div>
      </div>
    </Link>
  );
}
