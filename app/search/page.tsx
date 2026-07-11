import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { SearchFiltersBar } from "./SearchFiltersBar";
import { SearchSkeletonGrid } from "@/components/search/SearchSkeletonGrid";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const SORT_MAP: Record<string, string> = {
  trending: "TRENDING_DESC",
  score: "SCORE_DESC",
};

const STATUS_MAP: Record<string, string> = {
  releasing: "RELEASING",
  current_season: "RELEASING",
  finished: "FINISHED",
  not_yet_released: "NOT_YET_RELEASED",
  cancelled: "CANCELLED",
};

const SEASON_MAP: Record<string, string> = {
  spring: "SPRING",
  summer: "SUMMER",
  fall: "FALL",
  winter: "WINTER",
};

function normalizeParams(
  raw: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const p: Record<string, string | string[] | undefined> = { ...raw };

  // type: 'anime' → 'ANIME', 'manga' → 'MANGA'
  const rawType = str(p.type).toLowerCase();
  if (rawType === "anime") p.type = "ANIME";
  else if (rawType === "manga") p.type = "MANGA";

  // sort: 'trending' → 'TRENDING_DESC', 'score' → 'SCORE_DESC'
  const rawSort = str(p.sort).toLowerCase();
  if (SORT_MAP[rawSort]) p.sort = SORT_MAP[rawSort];

  // status: 'releasing' → 'RELEASING', etc.
  const rawStatus = str(p.status).toLowerCase();
  if (STATUS_MAP[rawStatus]) p.status = STATUS_MAP[rawStatus];
  else if (rawStatus) p.status = rawStatus.toUpperCase();

  // season: 'spring' → 'SPRING', etc.
  const rawSeason = str(p.season).toLowerCase();
  if (SEASON_MAP[rawSeason]) p.season = SEASON_MAP[rawSeason];

  // genre: normalise to uppercase (AniList expects e.g. "Action", but genre_in accepts any case)
  // Keep as-is — AniList genre values are already title-cased in our dropdowns

  // Default to BROWSE unless tab or mode=ai is explicitly set
  if (!str(p.tab)) {
    const mode = str(p.mode).toLowerCase();
    p.tab = mode === "ai" ? "ai" : "browse";
  }

  return p;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = normalizeParams(raw);

  const tab = str(params.tab) || "browse";
  const q = str(params.q);
  const genre = str(params.genre);
  const status = str(params.status);
  const format = str(params.format);
  const year = str(params.year);
  const sort = str(params.sort);
  const season = str(params.season);

  const hasQuery = q.length >= 2;
  const hasFilter = !!(genre || status || format || year || sort || season);
  const showResults = tab === "browse" ? (hasFilter || hasQuery) : hasQuery;

  return (
    <div className="py-12 min-h-screen" style={{ background: "var(--bg)" }}>
      <SearchFiltersBar params={params}>
        {showResults ? (
          <Suspense fallback={<SearchSkeletonGrid />}>
            <SearchResults params={params} />
          </Suspense>
        ) : null}
      </SearchFiltersBar>
    </div>
  );
}
