"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecommendedAnime {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  similarity: number;
}

function scoreClass(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function ForYouSection() {
  const [recs, setRecs] = useState<RecommendedAnime[]>([]);
  const [needsMoreData, setNeedsMoreData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        if (data.needsMoreData) setNeedsMoreData(true);
        else setRecs(data.recommendations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="px-4 md:px-8">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          For You
        </h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 rounded-lg animate-pulse"
              style={{ width: 160, height: 225, background: "var(--bg-card)" }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (needsMoreData) {
    return (
      <section className="px-4 md:px-8">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          For You
        </h2>
        <div
          className="p-6 rounded-xl flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <span className="text-2xl opacity-40">✦</span>
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
            Rate 3+ anime to unlock recommendations
          </p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Your personal anime taste profile builds as you watch and rate
          </p>
          <Link href="/search?sort=POPULARITY_DESC" className="btn-ghost text-sm">
            Browse popular anime →
          </Link>
        </div>
      </section>
    );
  }

  if (recs.length === 0) return null;

  return (
    <section className="px-4 md:px-8">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          For You
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent-bright)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ✦ AI picks
        </span>
      </div>
      <div className="scroll-row">
        {recs.map((anime) => {
          const title = anime.titleEnglish ?? anime.title;
          return (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="group relative block shrink-0 overflow-hidden card-base card-hover"
              style={{ width: 160 }}
            >
              <div className="relative overflow-hidden" style={{ height: 225, width: 160 }}>
                {anime.coverImage ? (
                  <Image
                    src={anime.coverImage}
                    alt={title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-card)" }}>
                    <span className="text-3xl opacity-20">✦</span>
                  </div>
                )}
                {anime.averageScore !== null && (
                  <div className="absolute top-2 right-2">
                    <span className={`score-badge ${scoreClass(anime.averageScore)}`}>
                      {anime.averageScore}
                    </span>
                  </div>
                )}
                <div
                  className="absolute bottom-2 left-2"
                  style={{
                    background: "var(--accent-muted)",
                    border: "1px solid var(--accent)",
                    borderRadius: 4,
                    padding: "1px 5px",
                    fontSize: 10,
                    color: "var(--accent-bright)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {Math.round(anime.similarity * 100)}% match
                </div>
              </div>
              <div className="px-2 py-2">
                <p className="text-xs font-medium truncate" style={{ color: "var(--fg-muted)" }}>
                  {title}
                </p>
                {anime.format && (
                  <span className="badge mt-0.5" style={{ fontSize: "10px", padding: "1px 5px" }}>
                    {anime.format.replace("_", " ")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
