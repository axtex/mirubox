import Image from "next/image";
import Link from "next/link";
import {
  getTrending,
  getPopular,
  getSeasonalAnime,
  getCurrentSeason,
  getDisplayTitle,
} from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";
import { ForYouSection, recommendationToForYouItem } from "@/components/home/ForYouSection";
import { auth } from "@/auth";
import { getRecommendations } from "@/lib/recommendations";

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const session = await auth();

  const [trending, popular, seasonal, manga] = await Promise.all([
    getTrending("ANIME", 1, 20),
    getPopular("ANIME", 1, 20),
    getSeasonalAnime(season, year, 1, 20),
    getPopular("MANGA", 1, 7),
  ]);

  const trendingIds = new Set(trending.media.map((a) => a.id));
  const popularFiltered = popular.media.filter((a) => !trendingIds.has(a.id));
  const shownIds = new Set([
    ...trending.media.map((a) => a.id),
    ...popularFiltered.map((a) => a.id),
  ]);
  const seasonalFiltered = seasonal.media.filter((a) => !shownIds.has(a.id));

  const featured = trending.media[0] ?? null;
  const featuredTitle = featured ? getDisplayTitle(featured.title) : "";

  const seasonLabel = season[0].toUpperCase() + season.slice(1).toLowerCase();

  let forYouItems: ReturnType<typeof recommendationToForYouItem>[] = [];
  let forYouNeedsMoreData = true;

  if (session?.user?.id) {
    const recs = await getRecommendations(session.user.id, 20);
    forYouNeedsMoreData = recs.needsMoreData;
    forYouItems = recs.recommendations.map(recommendationToForYouItem);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {featured && (
        <section className="hero-section relative w-full overflow-hidden">
          {/* Background */}
          {featured.bannerImage ? (
            <Image
              src={featured.bannerImage}
              alt={featuredTitle}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : featured.coverImage.extraLarge ? (
            <Image
              src={featured.coverImage.extraLarge}
              alt={featuredTitle}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--bg-card)" }} />
          )}

          {/* Cinematic gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,15,18,0.2) 0%, rgba(15,15,18,0.6) 50%, rgba(15,15,18,0.97) 100%)",
            }}
          />

          {/* Content — bottom-left */}
          <div className="absolute bottom-0 left-0 px-5 pb-8 max-w-2xl md:px-10 md:pb-14">
            {featured.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {featured.genres.slice(0, 3).map((g) => (
                  <span key={g} className="genre-chip">{g}</span>
                ))}
              </div>
            )}

            <h1 className="text-display mb-3 line-clamp-2">{featuredTitle}</h1>

            <div
              className="flex flex-wrap items-center gap-3 mb-5 text-label"
              style={{ color: "var(--fg-muted)" }}
            >
              {featured.averageScore !== null && (
                <span>★ {featured.averageScore}</span>
              )}
              {featured.episodes !== null && (
                <span>{featured.episodes} EPS</span>
              )}
              {featured.season && featured.seasonYear && (
                <span>{featured.season} {featured.seasonYear}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/anime/${featured.id}`} className="btn-primary">
                VIEW DETAILS
              </Link>
              <Link href={`/anime/${featured.id}`} className="btn-ghost">
                + ADD TO WATCHLIST
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Content sections ─────────────────────────────────────────── */}
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 72, paddingBottom: 72 }}>
        {session && (
          <ForYouSection items={forYouItems} needsMoreData={forYouNeedsMoreData} />
        )}

        <SectionRow
          title="TRENDING THIS WEEK"
          seeAllHref="/search?sort=TRENDING_DESC"
          items={trending.media.slice(1)}
        />
        <SectionRow
          title="POPULAR ALL TIME"
          seeAllHref="/search?sort=POPULARITY_DESC"
          items={popularFiltered}
        />
        <SectionRow
          title={`${seasonLabel.toUpperCase()} ${year}`}
          seeAllHref="/search?sort=POPULARITY_DESC&season=true"
          items={seasonalFiltered}
        />
        <SectionRow
          title="MANGA SPOTLIGHT"
          seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
          items={manga.media}
        />
      </div>

      {/* ── Weekly Digest CTA ─────────────────────────────────────────── */}
      <section className="px-4 md:px-8 pb-20">
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-12"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, var(--bg-card-high) 0%, var(--bg-surface) 70%)",
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
          }}
        >
          <div className="flex-1">
            <h2
              className="font-display uppercase"
              style={{ fontFamily: "var(--font-anybody)", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--fg)" }}
            >
              WEEKLY CINEMATIC DIGEST
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)", maxWidth: 400 }}>
              Seasonal rankings, studio spotlights, and rare gems delivered.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="YOUR EMAIL"
              readOnly
              className="flex-1 md:w-64 px-4 py-3 outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-bright)",
                borderRadius: 2,
                color: "var(--fg)",
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                letterSpacing: "0.08em",
              }}
            />
            <button className="btn-primary whitespace-nowrap">TRANSMIT</button>
          </div>
        </div>
      </section>
    </div>
  );
}
