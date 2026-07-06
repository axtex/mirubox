import { fetchDiscoverPicks, type DiscoverMediaType } from "@/lib/discover-picks";
import { DiscoverCarousel } from "@/components/home/DiscoverCarousel";

interface DiscoverSectionProps {
  type?: DiscoverMediaType;
  maxItems?: number;
}

export async function DiscoverSection({ type = "ANIME", maxItems = 7 }: DiscoverSectionProps) {
  const picks = await fetchDiscoverPicks(type);
  return <DiscoverCarousel picks={picks} maxItems={maxItems} />;
}
