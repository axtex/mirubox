import { ScrollableCardRow, type ScrollCardItem } from "@/components/detail/ScrollableCardRow";
import type { CharacterEdge } from "@/types/anilist";

interface Props {
  chars: CharacterEdge[];
}

export function AnimeVASection({ chars }: Props) {
  const seen = new Set<number>();
  const items: ScrollCardItem[] = [];

  for (const edge of chars) {
    const va = edge.voiceActors[0];
    if (!va || seen.has(va.id)) continue;
    seen.add(va.id);
    items.push({
      id: va.id,
      image: va.image.large,
      name: va.name.full ?? "",
      subLine: edge.node.name.full ?? "",
    });
  }

  return <ScrollableCardRow title="VOICE ACTORS" items={items} />;
}
