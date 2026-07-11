import type { DiscoverEntry, DiscoverMediaType } from "@/lib/discover-entries";

export interface SearchDiscoverEntry extends DiscoverEntry {
  /** Query submitted on chip click when different from the visible label. */
  searchQuery?: string;
}

/**
 * Curated discover prompts for the search page — each label maps to a
 * representative title so chip clicks always return at least one result.
 */
export const ANIME_SEARCH_PROMPTS: SearchDiscoverEntry[] = [
  { label: "something like haikyu!!", id: 20464 },
  { label: "single dad raising a kid", id: 28891 },
  { label: "melancholy by the sea", id: 4181 },
  { label: "enemies who get each other", id: 101348 },
  { label: "life after the war ends", id: 21856 },
  { label: "god is tired of everything", id: 38524 },
  { label: "love that ruins you slowly", id: 34382 },
  { label: "small town wrongness", id: 934 },
  { label: "found family", id: 5114 },
  { label: "cozy witches", id: 431 },
  { label: "absurd but deeply sincere", id: 8795 },
  { label: "the last summer before everything changed", id: 21689 },
  { label: "girl who refuses to quit", id: 20464 },
  { label: "quiet devastation", id: 30 },
  { label: "two people stuck in a room", id: 1535 },
  { label: "world ending without fireworks", id: 28621 },
  { label: "bittersweet growing up", id: 2167 },
];

export const MANGA_SEARCH_PROMPTS: SearchDiscoverEntry[] = [
  { label: "decades to earn the payoff", id: 30013 },
  { label: "monster learning to be human", id: 30008 },
  { label: "one fight changed everything", id: 30002 },
  { label: "ink-stained obsession", id: 37799 },
  { label: "the long road", id: 53390 },
  { label: "can't go home", id: 86243 },
  { label: "muted pain", id: 80011 },
  { label: "chaotic bonds", id: 108556 },
  { label: "romance that takes 100 chapters", id: 30022 },
  { label: "morally grey protagonist", id: 30003 },
  { label: "town with a secret", id: 86133 },
  { label: "grief drawn in ink", id: 30021 },
  { label: "chosen crew", id: 80439 },
  { label: "battle manga with a heart", id: 13 },
  { label: "wrong for good reasons", id: 30007 },
  { label: "something is missing", id: 35230 },
];

export const SEARCH_DISCOVER_PROMPTS: Record<DiscoverMediaType, SearchDiscoverEntry[]> = {
  ANIME: ANIME_SEARCH_PROMPTS,
  MANGA: MANGA_SEARCH_PROMPTS,
};

const PROMPT_LOOKUP = new Map<string, SearchDiscoverEntry>(
  [...ANIME_SEARCH_PROMPTS, ...MANGA_SEARCH_PROMPTS].map((entry) => [
    (entry.searchQuery ?? entry.label).toLowerCase(),
    entry,
  ]),
);

export function findSearchDiscoverPrompt(
  query: string,
  type: DiscoverMediaType,
): DiscoverEntry | null {
  const normalized = query.trim().toLowerCase();
  const entry = PROMPT_LOOKUP.get(normalized);
  if (!entry) return null;
  const pool = SEARCH_DISCOVER_PROMPTS[type];
  return pool.some(
    (item) => (item.searchQuery ?? item.label).toLowerCase() === normalized,
  )
    ? entry
    : null;
}
