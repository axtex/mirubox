import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

export interface ForYouItem {
  anime: AnimeCardType;
  similarity: number;
}

interface ForYouSectionProps {
  items: ForYouItem[];
  needsMoreData: boolean;
  isLoggedIn: boolean;
}

export function ForYouSection({
  items = [],
  needsMoreData = true,
  isLoggedIn = false,
}: ForYouSectionProps) {
  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">FOR YOU</h2>
          <span className="text-label flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
            <Sparkles className="w-3 h-3" />
            AI PICKS
          </span>
        </div>
        <div className="section-underline" />
      </div>

      {!isLoggedIn && (
        <div
          className="flex flex-col items-center gap-3 p-8 text-center"
          style={{
            border: "1px dashed var(--border-bright)",
            borderRadius: 4,
            background: "var(--bg-surface)",
          }}
        >
          <Sparkles className="w-6 h-6" style={{ color: "var(--fg-subtle)" }} />
          <p className="text-headline-md font-display uppercase" style={{ fontSize: 16 }}>
            PERSONALIZED PICKS
          </p>
          <p className="text-label" style={{ color: "var(--fg-subtle)" }}>
            SIGN IN TO UNLOCK →
          </p>
          <Link href="/auth/signin" className="btn-primary" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
            SIGN IN
          </Link>
        </div>
      )}

      {isLoggedIn && needsMoreData && (
        <div
          className="flex flex-col items-center gap-3 p-8 text-center"
          style={{
            border: "1px dashed var(--border-bright)",
            borderRadius: 4,
            background: "var(--bg-surface)",
          }}
        >
          <Sparkles className="w-6 h-6" style={{ color: "var(--fg-subtle)" }} />
          <p className="text-headline-md font-display uppercase" style={{ fontSize: 16 }}>
            DISCOVER YOUR TASTE
          </p>
          <p className="text-label" style={{ color: "var(--fg-subtle)" }}>
            RATE 3 ANIME TO UNLOCK →
          </p>
          <Link href="/search?sort=POPULARITY_DESC" className="btn-ghost" style={{ minHeight: 36, padding: "7px 16px", fontSize: 10 }}>
            BROWSE POPULAR
          </Link>
        </div>
      )}

      {isLoggedIn && !needsMoreData && items.length > 0 && (
        <div className="section-cards">
          {items.slice(0, 7).map(({ anime, similarity }) => (
            <AnimeCard key={anime.id} anime={anime} size="md" similarity={similarity} />
          ))}
        </div>
      )}
    </section>
  );
}

export function recommendationToForYouItem(r: {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  similarity: number;
}): ForYouItem {
  return {
    similarity: r.similarity,
    anime: {
      id: r.id,
      title: { romaji: r.title, english: r.titleEnglish, native: null },
      coverImage: { large: r.coverImage, extraLarge: r.coverImage },
      bannerImage: null,
      genres: r.genres ?? [],
      episodes: null,
      chapters: null,
      status: null,
      season: null,
      seasonYear: null,
      averageScore: r.averageScore,
      popularity: null,
      format: r.format,
      type: "ANIME",
    },
  };
}
