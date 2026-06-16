"use client";

import { useState } from "react";

interface RatingInputProps {
  animeId: number;
  initialRating: number | null;
  isLoggedIn: boolean;
}

export function RatingInput({ animeId, initialRating, isLoggedIn }: RatingInputProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) return null;

  async function handleRate(score: number) {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, score }),
      });
      setRating(score);
    } finally {
      setLoading(false);
    }
  }

  const active = hover ?? rating;

  return (
    <div>
      <p className="text-label mb-2" style={{ color: "var(--fg-subtle)" }}>YOUR RATING</p>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={loading}
            onClick={() => handleRate(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-center py-1.5 transition-all"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 2,
              border: `1px solid ${active !== null && n <= active ? "var(--primary)" : "var(--border)"}`,
              background: active !== null && n <= active ? "var(--primary)" : "var(--bg-card)",
              color: active !== null && n <= active ? "#fff" : "var(--fg-subtle)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            aria-label={`Rate ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      {rating !== null && (
        <p className="mt-1.5 text-label" style={{ color: "var(--fg-subtle)" }}>
          RATED {rating}/10
        </p>
      )}
    </div>
  );
}
