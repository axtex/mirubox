import { Suspense } from "react";
import {
  getCurrentSeason,
  getNextSeason,
  formatSeasonLabel,
} from "@/lib/anilist";
import { getAnimeBrowseShelves } from "@/lib/browse-shelves";
import { SectionRow } from "@/components/anime/SectionRow";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";

export const revalidate = 3600;

export default async function AnimeBrowsePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const { trending, seasonal, upcoming, topRated } = await getAnimeBrowseShelves();

  const currentSeasonLabel = `CURRENT SEASON — ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `UPCOMING — ${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        {trending.length > 0 && (
          <SectionRow
            title="TRENDING NOW"
            seeAllHref="/search?type=anime&sort=TRENDING_DESC&mode=browse"
            items={trending}
          />
        )}

        {seasonal.length > 0 && (
          <SectionRow
            title={currentSeasonLabel}
            seeAllHref={`/search?type=anime&season=${season.toLowerCase()}&year=${year}&mode=browse`}
            items={seasonal}
          />
        )}

        {upcoming.length > 0 && (
          <SectionRow
            title={upcomingSeasonLabel}
            seeAllHref={`/search?type=anime&season=${nextSeason.toLowerCase()}&year=${nextYear}&status=NOT_YET_RELEASED&mode=browse`}
            items={upcoming}
          />
        )}

        {topRated.length > 0 && (
          <SectionRow
            title="ALL TIME"
            seeAllHref="/search?type=anime&sort=SCORE_DESC&mode=browse"
            items={topRated}
          />
        )}

        <Suspense fallback={null}>
          <DiscoverSection type="ANIME" maxItems={24} />
        </Suspense>

        <Suspense fallback={null}>
          <CuratedListsSection />
        </Suspense>
      </div>
    </div>
  );
}
