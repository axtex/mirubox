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
import { ForYouSection } from "@/components/home/ForYouSection";
import { auth } from "@/auth";

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const session = await auth();

  const [trending, popular, seasonal, manga] = await Promise.all([
    getTrending("ANIME", 1, 18),
    getPopular("ANIME", 1, 12),
    getSeasonalAnime(season, year, 1, 12),
    getPopular("MANGA", 1, 12),
  ]);

  const featured = trending.media[0] ?? null;
  const featuredTitle = featured ? getDisplayTitle(featured.title) : "";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {featured && (
        <section
          className="relative w-full overflow-hidden md:h-[70vh]"
          style={{ height: "55vw", minHeight: 280, maxHeight: "70vh" }}
        >
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
            <div className="w-full h-full" style={{ background: "var(--bg-card)" }} />
          )}

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--bg) 0%, rgba(13,13,18,0.75) 45%, rgba(13,13,18,0.25) 100%)",
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-10 md:pb-14">
            {featured.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {featured.genres.slice(0, 3).map((g) => (
                  <span key={g} className="badge" style={{ fontSize: "11px" }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            <h1
              className="text-2xl md:text-5xl font-bold leading-tight max-w-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              {featuredTitle}
            </h1>

            <div
              className="flex items-center gap-3 mb-5 text-sm"
              style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
            >
              {featured.averageScore !== null && (
                <span
                  className={`score-badge ${featured.averageScore >= 80 ? "high" : featured.averageScore >= 60 ? "mid" : "low"}`}
                >
                  ★ {featured.averageScore}
                </span>
              )}
              {featured.episodes !== null && (
                <span>{featured.episodes} eps</span>
              )}
              {featured.season && featured.seasonYear && (
                <span>
                  {featured.season[0] + featured.season.slice(1).toLowerCase()}{" "}
                  {featured.seasonYear}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Link href={`/anime/${featured.id}`} className="btn-primary">
                View Details
              </Link>
              <Link href={`/anime/${featured.id}`} className="btn-ghost">
                + Watchlist
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Content sections ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-10 py-8">
        {session && <ForYouSection />}
        <SectionRow
          title="Trending This Week"
          seeAllHref="/search?sort=TRENDING_DESC"
          items={trending.media}
        />
        <SectionRow
          title="Popular All Time"
          seeAllHref="/search?sort=POPULARITY_DESC"
          items={popular.media}
        />
        <SectionRow
          title={`${season[0] + season.slice(1).toLowerCase()} ${year}`}
          seeAllHref="/search?sort=POPULARITY_DESC&season=true"
          items={seasonal.media}
        />
        <SectionRow
          title="Top Manga"
          seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
          items={manga.media}
        />
      </div>
    </div>
  );
}
