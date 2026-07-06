import { ScrollableCardRow } from "@/components/detail/ScrollableCardRow";
import type { CharacterEdge } from "@/types/anilist";

interface Props {
  chars: CharacterEdge[];
}

export function AnimeCharacterSection({ chars }: Props) {
  const items = chars.map(({ node, role }) => ({
    id: node.id,
    image: node.image.large,
    name: node.name.full ?? "",
    subLine: role === "MAIN" ? "MAIN" : "SUP",
  }));

  return <ScrollableCardRow title="CHARACTERS" items={items} />;
}
