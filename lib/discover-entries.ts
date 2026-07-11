export type DiscoverMediaType = "ANIME" | "MANGA";

export interface DiscoverEntry {
  label: string;
  id: number;
}

export const ANIME_DISCOVER: DiscoverEntry[] = [
  { label: "cozy witches", id: 431 },
  { label: "countryside magic", id: 21858 },
  { label: "soft magic", id: 112609 },
  { label: "wrong for good reasons", id: 101348 },
  { label: "can't go back", id: 19 },
  { label: "guilty minds", id: 20755 },
  { label: "found family", id: 5114 },
  { label: "chosen family", id: 154587 },
  { label: "somewhere to belong", id: 103195 },
  { label: "slow burn", id: 21827 },
  { label: "worth the wait", id: 10165 },
  { label: "almost said it", id: 20954 },
  { label: "brain rot art", id: 8795 },
  { label: "visually unhinged", id: 227 },
  { label: "fever dream frames", id: 2246 },
  { label: "legendary openers", id: 1 },
  { label: "instant hook", id: 9253 },
  { label: "never recovered", id: 16498 },
  { label: "quiet devastation", id: 30 },
  { label: "fell apart beautifully", id: 100388 },
  { label: "gentle grief", id: 9989 },
  { label: "already canon", id: 140960 },
  { label: "this gen's best", id: 113415 },
  { label: "required watching", id: 101922 },
  { label: "sports highs", id: 20464 },
  { label: "didn't expect to cry", id: 20665 },
  { label: "last 5 min energy", id: 11061 },
  { label: "just vibes", id: 21366 },
  { label: "art as feeling", id: 457 },
  { label: "still air", id: 4181 },
];

export const MANGA_DISCOVER: DiscoverEntry[] = [
  { label: "the long road", id: 53390 },
  { label: "miles of story", id: 30013 },
  { label: "worth the length", id: 30007 },
  { label: "wrong for good reasons", id: 30003 },
  { label: "too far gone", id: 30008 },
  { label: "what you carry", id: 35230 },
  { label: "found family", id: 25 },
  { label: "chaotic bonds", id: 108556 },
  { label: "chosen crew", id: 80439 },
  { label: "slow burn", id: 30022 },
  { label: "the benchmark", id: 30002 },
  { label: "worth the slow burn", id: 30031 },
  { label: "brain rot art", id: 105778 },
  { label: "visceral art", id: 37799 },
  { label: "visually unhinged", id: 80471 },
  { label: "long run legends", id: 30051 },
  { label: "your parents read this", id: 30026 },
  { label: "peak volumes", id: 30025 },
  { label: "quiet devastation", id: 30021 },
  { label: "something is missing", id: 86133 },
  { label: "muted pain", id: 80011 },
  { label: "shonen staples", id: 13 },
  { label: "jump legends", id: 30011 },
  { label: "battle manga", id: 75989 },
  { label: "slow confession", id: 30100 },
  { label: "finally", id: 39201 },
  { label: "love arcs", id: 55215 },
  { label: "another world", id: 85934 },
  { label: "can't go home", id: 86243 },
  { label: "better world", id: 215 },
];

export const DISCOVER_ENTRIES: Record<DiscoverMediaType, DiscoverEntry[]> = {
  ANIME: ANIME_DISCOVER,
  MANGA: MANGA_DISCOVER,
};
