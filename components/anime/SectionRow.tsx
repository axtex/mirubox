import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton } from "./AnimeCardSkeleton";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface SectionRowProps {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  seeAllAccent?: boolean;
  items: AnimeCardType[];
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const ROW_LIMIT = 7;

export function SectionRow({
  title,
  seeAllHref,
  seeAllLabel = "VIEW ALL",
  seeAllAccent = false,
  items,
  size = "md",
  loading,
}: SectionRowProps) {
  const rowItems = items.slice(0, ROW_LIMIT);

  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">{title}</h2>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className={`text-label inline-flex items-center gap-1 ${seeAllAccent ? "link-accent" : "link-subtle"}`}
              style={seeAllAccent ? { color: "var(--primary)" } : undefined}
            >
              {seeAllLabel}
              {seeAllAccent && (
                <ChevronRight size={12} strokeWidth={2} color="var(--primary)" aria-hidden />
              )}
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
