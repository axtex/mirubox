import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { SearchFiltersBar } from "./SearchFiltersBar";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="px-4 md:px-8 py-6" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Filters bar (client) */}
      <Suspense fallback={null}>
        <SearchFiltersBar params={params} />
      </Suspense>

      {/* Results */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <p style={{ color: "var(--fg-muted)" }}>Searching…</p>
          </div>
        }
      >
        <SearchResults params={params} />
      </Suspense>
    </div>
  );
}
