import {
  getTrending,
  getSeasonalAnime,
  getTopRated,
  getCurrentSeason,
  getNextSeason,
  formatSeasonLabel,
} from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";

export const revalidate = 3600;

export default async function AnimeBrowsePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const [trending, seasonal, upcoming, topRated] = await Promise.all([
    getTrending("ANIME", 1, 20),
    getSeasonalAnime(season, year, 1, 20),
    getSeasonalAnime(nextSeason, nextYear, 1, 20),
    getTopRated("ANIME", 1, 20),
  ]);

  const currentSeasonLabel = `CURRENT SEASON — ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `UPCOMING — ${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        {trending.media.length > 0 && (
          <SectionRow
            title="TRENDING NOW"
            seeAllHref="/search?type=anime&sort=TRENDING_DESC&mode=browse"
            items={trending.media}
          />
        )}

        {seasonal.media.length > 0 && (
          <SectionRow
            title={currentSeasonLabel}
            seeAllHref={`/search?type=anime&season=${season.toLowerCase()}&year=${year}&mode=browse`}
            items={seasonal.media}
          />
        )}

        {upcoming.media.length > 0 && (
          <SectionRow
            title={upcomingSeasonLabel}
            seeAllHref={`/search?type=anime&season=${nextSeason.toLowerCase()}&year=${nextYear}&status=NOT_YET_RELEASED&mode=browse`}
            items={upcoming.media}
          />
        )}

        {topRated.media.length > 0 && (
          <SectionRow
            title="ALL TIME"
            seeAllHref="/search?type=anime&sort=SCORE_DESC&mode=browse"
            items={topRated.media}
          />
        )}

        <DiscoverSection type="ANIME" maxItems={24} />

        <CuratedListsSection />
      </div>
    </div>
  );
}
