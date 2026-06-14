import { getTrending, getPopular } from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";

export default async function MangaPage() {
  const [trending, popular, publishing] = await Promise.all([
    getTrending("MANGA", 1, 18),
    getPopular("MANGA", 1, 12),
    // Publishing = RELEASING manga, sorted by trending
    getTrending("MANGA", 2, 12),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 md:px-8 pt-8 pb-4">
        <h1
          className="text-3xl md:text-4xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          Manga
        </h1>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Discover, track, and explore manga series
        </p>
      </div>

      <div className="flex flex-col gap-10 py-4 pb-10">
        <SectionRow
          title="Trending This Week"
          seeAllHref="/search?type=MANGA&sort=TRENDING_DESC"
          items={trending.media}
        />
        <SectionRow
          title="Most Popular All Time"
          seeAllHref="/search?type=MANGA&sort=POPULARITY_DESC"
          items={popular.media}
        />
        <SectionRow
          title="Currently Publishing"
          seeAllHref="/search?type=MANGA&status=RELEASING&sort=POPULARITY_DESC"
          items={publishing.media}
        />
      </div>
    </div>
  );
}
