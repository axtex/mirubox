import { Suspense } from "react";
import { getMangaBrowseShelves } from "@/lib/browse-shelves";
import { SectionRow } from "@/components/anime/SectionRow";
import { DiscoverSection } from "@/components/home/DiscoverSection";
import { CuratedListsSection } from "@/components/home/CuratedListsSection";

export const revalidate = 3600;

export default async function MangaPage() {
  const { trending, publishing, allTime } = await getMangaBrowseShelves();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        <SectionRow
          title="TRENDING NOW"
          seeAllHref="/search?type=manga&sort=TRENDING_DESC&mode=browse"
          items={trending}
        />

        <SectionRow
          title="CURRENTLY PUBLISHING"
          seeAllHref="/search?type=manga&status=RELEASING&mode=browse"
          items={publishing}
        />

        <SectionRow
          title="ALL TIME"
          seeAllHref="/search?type=manga&sort=SCORE_DESC&mode=browse"
          items={allTime}
        />

        <Suspense fallback={null}>
          <DiscoverSection type="MANGA" maxItems={24} />
        </Suspense>

        <Suspense fallback={null}>
          <CuratedListsSection />
        </Suspense>
      </div>
    </div>
  );
}
