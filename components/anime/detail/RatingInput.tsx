"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  animeId: number;
  initialRating: number | null;
  isLoggedIn: boolean;
}

export function RatingInput({
  animeId,
  initialRating,
  isLoggedIn,
}: RatingInputProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) return null;

  async function handleRate(score: number) {
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

  const displayRating = hover ?? rating;

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>
        Your rating
      </p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={loading}
            onClick={() => handleRate(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            className="w-6 h-6 flex items-center justify-center transition-transform hover:scale-125"
            aria-label={`Rate ${n}`}
          >
            <Star
              className="w-4 h-4"
              fill={displayRating !== null && n <= displayRating ? "var(--warning)" : "none"}
              stroke={displayRating !== null && n <= displayRating ? "var(--warning)" : "var(--fg-subtle)"}
            />
          </button>
        ))}
        {rating !== null && (
          <span
            className="ml-2 text-xs"
            style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
          >
            {rating}/10
          </span>
        )}
      </div>
    </div>
  );
}
