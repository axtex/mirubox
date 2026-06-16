import type { AnimeCard } from "@/types/anilist";

const ROW_LIMIT = 7;

/** Pick up to `limit` items not already in `shownIds`, then register them. */
export function takeUnique(
  items: AnimeCard[],
  shownIds: Set<number>,
  limit = ROW_LIMIT
): AnimeCard[] {
  const picked: AnimeCard[] = [];
  for (const item of items) {
    if (shownIds.has(item.id)) continue;
    picked.push(item);
    shownIds.add(item.id);
    if (picked.length >= limit) break;
  }
  return picked;
}
