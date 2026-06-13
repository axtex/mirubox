import Link from "next/link";
import { AnimeCard } from "./AnimeCard";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface SectionRowProps {
  title: string;
  seeAllHref?: string;
  items: AnimeCardType[];
  size?: "sm" | "md" | "lg";
}

export function SectionRow({ title, seeAllHref, items, size = "md" }: SectionRowProps) {
  return (
    <section className="px-4 md:px-6">
      <div className="section-header">
        <h2
          className="text-base md:text-lg font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs transition-colors"
            style={{ color: "var(--accent)" }}
          >
            See all →
          </Link>
        )}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="scroll-row md:hidden">
        {items.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} size="sm" />
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-6 gap-4">
        {items.slice(0, 6).map((anime) => (
          <AnimeCard key={anime.id} anime={anime} size={size} />
        ))}
      </div>
    </section>
  );
}
