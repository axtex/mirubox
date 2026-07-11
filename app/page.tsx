import {
  getTrending,
  getPopular,
  getSeasonalAnime,
  getCurrentSeason,
  getNextSeason,
  getDisplayTitle,
  formatSeasonLabel,
} from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";
import { ContinueSection } from "@/components/home/ContinueSection";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { WeeklyDigestSection } from "@/components/home/WeeklyDigestSection";
import { takeUnique } from "@/lib/homepage";

const HERO_COUNT = 8;

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const [trending, seasonal, upcoming, manga] = await Promise.all([
    getTrending("ANIME", 1, 28),
    getSeasonalAnime(season, year, 1, 20),
    getSeasonalAnime(nextSeason, nextYear, 1, 20),
    getPopular("MANGA", 1, 7),
  ]);

  const shownIds = new Set<number>();

  const heroSlides = trending.media.slice(0, HERO_COUNT).map((anime) => {
    shownIds.add(anime.id);
    return {
      id: anime.id,
      title: getDisplayTitle(anime.title),
      bannerImage: anime.bannerImage,
      coverImage: anime.coverImage.extraLarge ?? anime.coverImage.large,
      genres: anime.genres,
    };
  });

  const trendingRow = takeUnique(trending.media.slice(HERO_COUNT), shownIds);
  const seasonalRow = takeUnique(seasonal.media, shownIds);
  const upcomingRow = takeUnique(upcoming.media, shownIds);

  const currentSeasonLabel = `CURRENT · ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        <ContinueSection />

        <DiscoverSection type="ANIME" maxItems={24} />

        {trendingRow.length > 0 && (
          <SectionRow
            title="TRENDING THIS WEEK"
            seeAllHref="/search?type=anime&sort=TRENDING_DESC&mode=browse"
            items={trendingRow}
          />
        )}

        {seasonalRow.length > 0 && (
          <SectionRow
            title={currentSeasonLabel}
            seeAllHref={`/search?type=anime&season=${season.toLowerCase()}&year=${year}&status=CURRENT_SEASON&mode=browse`}
            items={seasonalRow}
          />
        )}

        {upcomingRow.length > 0 && (
          <SectionRow
            title={`UPCOMING · ${upcomingSeasonLabel}`}
            seeAllHref={`/search?type=anime&season=${nextSeason.toLowerCase()}&year=${nextYear}&status=NOT_YET_RELEASED&mode=browse`}
            items={upcomingRow}
          />
        )}

        {manga.media.length > 0 && (
          <SectionRow
            title="MANGA SPOTLIGHT"
            seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
            items={manga.media}
          />
        )}

        <CuratedListsSection />

        <WeeklyDigestSection />
      </div>
    </div>
  );
}
