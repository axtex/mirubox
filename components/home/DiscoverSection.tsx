import {
  fetchDiscoverPicks,
  selectDiscoverPicks,
  type DiscoverMediaType,
} from "@/lib/discover-picks";
import { DiscoverCarousel } from "@/components/home/DiscoverCarousel";

interface DiscoverSectionProps {
  type?: DiscoverMediaType;
  maxItems?: number;
}

export async function DiscoverSection({ type = "ANIME", maxItems = 7 }: DiscoverSectionProps) {
  let picks;
  try {
    picks = selectDiscoverPicks(await fetchDiscoverPicks(type), maxItems);
  } catch (err) {
    console.error("DiscoverSection failed:", err);
    return null;
  }

  if (picks.length === 0) return null;

  return <DiscoverCarousel picks={picks} />;
}
