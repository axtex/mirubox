import { Suspense } from "react";
import {
  getCurrentSeason,
  getNextSeason,
  getDisplayTitle,
  formatSeasonLabel,
} from "@/lib/anilist";
import { auth } from "@/auth";
import { getContinueItems } from "@/lib/continue-items";
import { getSeasonChallenge } from "@/lib/season-challenge";
import { toContinueStripSeasonChallenge } from "@/lib/season-challenge-client";
import { getHomeShelves } from "@/lib/browse-shelves";
import { SectionRow } from "@/components/anime/SectionRow";
import { ContinueStrip } from "@/components/home/ContinueStrip";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { takeUnique } from "@/lib/homepage";

export const revalidate = 3600;

const HERO_COUNT = 8;

function SectionRowSkeleton({ title }: { title: string }): React.JSX.Element {
  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">{title}</h2>
        </div>
        <div className="section-underline" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <AnimeCardSkeleton key={i} size="md" />
        ))}
      </div>
    </section>
  );
}

function CuratedListsSkeleton(): React.JSX.Element {
  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">CURATED LISTS</h2>
        </div>
        <div className="section-underline" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="shimmer"
            style={{ height: 160, borderRadius: 4, border: "1px solid var(--border)" }}
          />
        ))}
      </div>
    </section>
  );
}

/** Auth-gated home strip — streams in after the public shelf shell. */
async function HomeContinueIsland(): Promise<React.JSX.Element | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [continueItems, challengeData] = await Promise.all([
    getContinueItems(userId),
    getSeasonChallenge(userId),
  ]);

  const showContinueStrip =
    continueItems.length > 0 || (challengeData?.showOnHome ?? false);
  if (!showContinueStrip) return null;

  const seasonChallenge =
    challengeData?.showOnHome
      ? toContinueStripSeasonChallenge(challengeData)
      : null;

  return (
    <ContinueStrip
      items={continueItems}
      seasonChallenge={seasonChallenge}
    />
  );
}

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const { season: nextSeason, year: nextYear } = getNextSeason();

  const homeShelves = await getHomeShelves();
  const { trending, seasonal, upcoming, manga } = homeShelves;

  const shownIds = new Set<number>();

  const heroSlides = trending.slice(0, HERO_COUNT).map((anime) => {
    shownIds.add(anime.id);
    return {
      id: anime.id,
      title: getDisplayTitle(anime.title),
      bannerImage: anime.bannerImage,
      coverImage: anime.coverImage.extraLarge ?? anime.coverImage.large,
      genres: anime.genres,
    };
  });

  const trendingRow = takeUnique(trending.slice(HERO_COUNT), shownIds);
  const seasonalRow = takeUnique(seasonal, shownIds);
  const upcomingRow = takeUnique(upcoming, shownIds);

  const currentSeasonLabel = `CURRENT · ${formatSeasonLabel(season).toUpperCase()} ${year}`;
  const upcomingSeasonLabel = `${formatSeasonLabel(nextSeason).toUpperCase()} ${nextYear}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        <Suspense fallback={null}>
          <HomeContinueIsland />
        </Suspense>

        <Suspense fallback={<SectionRowSkeleton title="DISCOVER" />}>
          <DiscoverSection type="ANIME" maxItems={24} />
        </Suspense>

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

        {manga.length > 0 && (
          <SectionRow
            title="MANGA SPOTLIGHT"
            seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
            items={manga}
          />
        )}

        <Suspense fallback={<CuratedListsSkeleton />}>
          <CuratedListsSection />
        </Suspense>
      </div>
    </div>
  );
}
