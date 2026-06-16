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
import { ForYouSection, recommendationToForYouItem } from "@/components/home/ForYouSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { WeeklyDigestSection } from "@/components/home/WeeklyDigestSection";
import { auth } from "@/auth";
import { getRecommendations } from "@/lib/recommendations";
import { takeUnique } from "@/lib/homepage";

const HERO_COUNT = 8;

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();
  const session = await auth();

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

  let forYouItems: ReturnType<typeof recommendationToForYouItem>[] = [];
  let forYouNeedsMoreData = true;

  if (session?.user?.id) {
    const recs = await getRecommendations(session.user.id, 20);
    forYouNeedsMoreData = recs.needsMoreData;
    forYouItems = [];
    for (const item of recs.recommendations.map(recommendationToForYouItem)) {
      if (shownIds.has(item.anime.id)) continue;
      forYouItems.push(item);
      shownIds.add(item.anime.id);
      if (forYouItems.length >= 7) break;
    }
  }

  const trendingRow = takeUnique(trending.media.slice(HERO_COUNT), shownIds);
  const seasonalRow = takeUnique(seasonal.media, shownIds);
  const upcomingRow = takeUnique(upcoming.media, shownIds);

  const currentSeasonLabel = `CURRENT · ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        <ForYouSection
          items={forYouItems}
          needsMoreData={forYouNeedsMoreData}
          isLoggedIn={!!session}
        />

        {trendingRow.length > 0 && (
          <SectionRow
            title="TRENDING THIS WEEK"
            seeAllHref="/search?sort=TRENDING_DESC"
            items={trendingRow}
          />
        )}

        {seasonalRow.length > 0 && (
          <SectionRow
            title={currentSeasonLabel}
            seeAllHref={`/search?year=${year}&sort=POPULARITY_DESC`}
            items={seasonalRow}
          />
        )}

        {upcomingRow.length > 0 && (
          <SectionRow
            title={`UPCOMING · ${upcomingSeasonLabel}`}
            seeAllHref={`/search?year=${nextYear}&sort=POPULARITY_DESC`}
            items={upcomingRow}
          />
        )}

        <CuratedListsSection />

        {manga.media.length > 0 && (
          <SectionRow
            title="MANGA SPOTLIGHT"
            seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
            items={manga.media}
          />
        )}

        <WeeklyDigestSection />
      </div>
    </div>
  );
}
