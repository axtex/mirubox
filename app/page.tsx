import {
  getTrending,
  getPopular,
  getSeasonalAnime,
  getCurrentSeason,
  getNextSeason,
  getDisplayTitle,
  formatSeasonLabel,
} from "@/lib/anilist";
import { auth } from "@/auth";
import { getContinueItems } from "@/lib/continue-items";
import { getSeasonChallenge } from "@/lib/season-challenge";
import { toContinueStripSeasonChallenge } from "@/lib/season-challenge-client";
import { SectionRow } from "@/components/anime/SectionRow";
import { ContinueStrip } from "@/components/home/ContinueStrip";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { WeeklyDigestSection } from "@/components/home/WeeklyDigestSection";
import { takeUnique } from "@/lib/homepage";
import type { MediaPage } from "@/types/anilist";

const HERO_COUNT = 8;

const EMPTY_MEDIA_PAGE: MediaPage = {
  pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
  media: [],
};

export default async function HomePage() {
  const session = await auth();
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const challengeData = session?.user?.id
    ? await getSeasonChallenge(session.user.id)
    : null;

  const continueItems = session?.user?.id
    ? await getContinueItems(session.user.id)
    : [];

  const showContinueStrip =
    continueItems.length > 0 || (challengeData?.showOnHome ?? false);

  const seasonChallenge =
    challengeData?.showOnHome
      ? toContinueStripSeasonChallenge(challengeData)
      : null;

  const [trendingResult, seasonalResult, upcomingResult, mangaResult] = await Promise.allSettled([
    getTrending("ANIME", 1, 28),
    getSeasonalAnime(season, year, 1, 20),
    getSeasonalAnime(nextSeason, nextYear, 1, 20),
    getPopular("MANGA", 1, 7),
  ]);

  const trending = trendingResult.status === "fulfilled" ? trendingResult.value : EMPTY_MEDIA_PAGE;
  const seasonal = seasonalResult.status === "fulfilled" ? seasonalResult.value : EMPTY_MEDIA_PAGE;
  const upcoming = upcomingResult.status === "fulfilled" ? upcomingResult.value : EMPTY_MEDIA_PAGE;
  const manga = mangaResult.status === "fulfilled" ? mangaResult.value : EMPTY_MEDIA_PAGE;

  if (trendingResult.status === "rejected") {
    console.error("Home trending fetch failed:", trendingResult.reason);
  }
  if (seasonalResult.status === "rejected") {
    console.error("Home seasonal fetch failed:", seasonalResult.reason);
  }
  if (upcomingResult.status === "rejected") {
    console.error("Home upcoming fetch failed:", upcomingResult.reason);
  }
  if (mangaResult.status === "rejected") {
    console.error("Home manga fetch failed:", mangaResult.reason);
  }

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
        {showContinueStrip && (
          <ContinueStrip
            items={continueItems}
            seasonChallenge={seasonChallenge}
          />
        )}

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
