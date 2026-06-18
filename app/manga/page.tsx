import Link from "next/link";
import { getTrending, searchMedia } from "@/lib/anilist";
import { SectionRow } from "@/components/anime/SectionRow";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";
import { auth } from "@/auth";

const GENRES = [
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
];

export default async function MangaPage() {
  const session = await auth();

  const [trending, publishing, allTime] = await Promise.all([
    getTrending("MANGA", 1, 14),
    searchMedia("", "MANGA", { status: "RELEASING", sort: "POPULARITY_DESC" }, 1, 14),
    searchMedia("", "MANGA", { sort: "SCORE_DESC" }, 1, 14),
  ]);

  // TODO: replace with manga taste vector
  const forYouItems = trending.media;

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
            {GENRES.map((genre) => (
              <Link
                key={genre}
                href={`/search?type=manga&genre=${encodeURIComponent(genre)}`}
                className="genre-chip"
              >
                {genre}
              </Link>
            ))}
          </div>
        </section>

        {/* 2. FOR YOU */}
        {session && (
          <section>
            <div className="section-header">
              <div className="section-header-row">
                <h2 className="text-headline-md font-display uppercase">FOR YOU</h2>
              </div>
              <div className="section-underline" />
            </div>
            <div className="section-cards">
              {forYouItems.slice(0, 7).map((item) => (
                <AnimeCard key={item.id} anime={item} size="md" />
              ))}
            </div>
          </section>
        )}

        {/* 3. TRENDING NOW */}
        <SectionRow
          title="TRENDING NOW"
          seeAllHref="/search?type=manga&sort=trending"
          items={trending.media}
        />

        {/* 4. CURRENTLY PUBLISHING */}
        <SectionRow
          title="CURRENTLY PUBLISHING"
          seeAllHref="/search?type=manga&status=releasing"
          items={publishing.media}
        />

        {/* 5. ALL TIME */}
        <SectionRow
          title="ALL TIME"
          seeAllHref="/search?type=manga&sort=score"
          items={allTime.media}
        />

        {/* 6. CURATED LISTS */}
        <CuratedListsSection />

      </div>
    </div>
  );
}
