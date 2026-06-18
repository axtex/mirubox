import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { SearchFiltersBar } from "./SearchFiltersBar";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const tab = str(params.tab) || "ai";
  const q = str(params.q);
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);

  const hasQuery = q.length >= 2;
  const hasFilter = !!(genre || status || format || year);
  const showResults = tab === "browse" ? hasFilter : hasQuery;

  return (
    <div className="py-12 min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Centered search section */}
      <div className="flex justify-center px-0">
        <Suspense fallback={null}>
          <SearchFiltersBar params={params} />
        </Suspense>
      </div>

      {/* Results — full page-container width */}
      {showResults && (
        <Suspense
          fallback={
            <div>
              <div className="h-5 w-32 shimmer rounded mb-4" />
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
                {Array.from({ length: 14 }).map((_, i) => (
                  <AnimeCardSkeleton key={i} size="md" />
                ))}
              </div>
            </div>
          }
        >
          <SearchResults params={params} />
        </Suspense>
      )}
    </div>
  );
}
