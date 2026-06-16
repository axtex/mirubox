import Link from "next/link";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton } from "./AnimeCardSkeleton";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface SectionRowProps {
  title: string;
  seeAllHref?: string;
  items: AnimeCardType[];
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const ROW_LIMIT = 7;

export function SectionRow({ title, seeAllHref, items, size = "md", loading }: SectionRowProps) {
  const rowItems = items.slice(0, ROW_LIMIT);

  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">{title}</h2>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-label link-subtle"
            >
              VIEW ALL →
            </Link>
          )}
        </div>
        <div className="section-underline" />
      </div>

      <div className="section-cards">
        {loading
          ? Array.from({ length: ROW_LIMIT }).map((_, i) => (
              <AnimeCardSkeleton key={i} size={size} />
            ))
          : rowItems.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} size={size} />
            ))}
      </div>
    </section>
  );
}
