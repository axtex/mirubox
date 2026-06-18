import Link from "next/link";
import {
  getTrending,
  getSeasonalAnime,
  getTopRated,
  getCurrentSeason,
  getNextSeason,
  formatSeasonLabel,
} from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";
import { ForYouSection, recommendationToForYouItem } from "@/components/home/ForYouSection";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { auth } from "@/auth";
import { getRecommendations } from "@/lib/recommendations";

const GENRE_CHIPS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
] as const;

export default async function AnimeBrowsePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();
  const session = await auth();

  const [trending, seasonal, upcoming, topRated] = await Promise.all([
    getTrending("ANIME", 1, 20),
    getSeasonalAnime(season, year, 1, 20),
    getSeasonalAnime(nextSeason, nextYear, 1, 20),
    getTopRated("ANIME", 1, 20),
  ]);

  let forYouItems: ReturnType<typeof recommendationToForYouItem>[] = [];
  let forYouNeedsMoreData = true;

  if (session?.user?.id) {
    const recs = await getRecommendations(session.user.id, 20);
    forYouNeedsMoreData = recs.needsMoreData;
    forYouItems = recs.recommendations.map(recommendationToForYouItem).slice(0, 7);
  }

  const currentSeasonLabel = `CURRENT SEASON — ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `UPCOMING — ${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>

        {/* 1. BROWSE BY GENRE */}
        <section>
          <div className="section-header">
            <div className="section-header-row">
              <h2 className="text-headline-md font-display uppercase">BROWSE BY GENRE</h2>
            </div>
            <div className="section-underline" />
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRE_CHIPS.map((genre) => (
              <Link
                key={genre}
                href={`/search?genre=${encodeURIComponent(genre)}&tab=browse`}
                className="genre-chip"
              >
                {genre}
              </Link>
            ))}
          </div>
        </section>

        {/* 2. FOR YOU */}
        {session && (
          <ForYouSection
            items={forYouItems}
            needsMoreData={forYouNeedsMoreData}
            isLoggedIn={true}
          />
        )}

        {/* 3. TRENDING NOW */}
        {trending.media.length > 0 && (
          <SectionRow
            title="TRENDING NOW"
            seeAllHref="/search?sort=TRENDING_DESC"
            items={trending.media}
          />
        )}

        {/* 4. CURRENT SEASON */}
        {seasonal.media.length > 0 && (
          <SectionRow
            title={currentSeasonLabel}
            seeAllHref={`/search?year=${year}&sort=POPULARITY_DESC`}
            items={seasonal.media}
          />
        )}

        {/* 5. UPCOMING SEASON */}
        {upcoming.media.length > 0 && (
          <SectionRow
            title={upcomingSeasonLabel}
            seeAllHref={`/search?year=${nextYear}&sort=POPULARITY_DESC`}
            items={upcoming.media}
          />
        )}

        {/* 6. ALL TIME */}
        {topRated.media.length > 0 && (
          <SectionRow
            title="ALL TIME"
            seeAllHref="/search?sort=SCORE_DESC"
            items={topRated.media}
          />
        )}

        {/* 7. CURATED LISTS */}
        <CuratedListsSection />

      </div>
    </div>
  );
}
