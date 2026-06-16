import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { SearchFiltersBar } from "./SearchFiltersBar";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div
      className="px-4 md:px-8 py-8 min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <Suspense fallback={null}>
        <SearchFiltersBar params={params} />
      </Suspense>

      <Suspense
        fallback={
          <div>
            <div className="h-5 w-32 shimmer rounded mb-4" />
            <div
              className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3"
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <AnimeCardSkeleton key={i} size="md" />
              ))}
            </div>
          </div>
        }
      >
        <SearchResults params={params} />
      </Suspense>
    </div>
  );
}
