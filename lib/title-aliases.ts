/** Stop words omitted when building acronyms from multi-word titles. */
const ACRONYM_STOP_WORDS = new Set(["the", "a", "an", "of", "and", "in", "to", "for", "ni", "wo"]);

/**
 * Community acronyms that don't follow first-letter rules (e.g. JJK, FMAB).
 * Values are substrings to match against cached title fields.
 */
export const TITLE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  jjk: ["Jujutsu Kaisen"],
  aot: ["Attack on Titan", "Shingeki no Kyojin"],
  snk: ["Shingeki no Kyojin", "Attack on Titan"],
  fmab: ["Fullmetal Alchemist: Brotherhood", "Fullmetal Alchemist Brotherhood"],
  fma: ["Fullmetal Alchemist"],
  mha: ["My Hero Academia", "Boku no Hero Academia"],
  bnha: ["Boku no Hero Academia", "My Hero Academia"],
  opm: ["One Punch Man", "One-Punch Man"],
  hxh: ["Hunter x Hunter", "Hunter X Hunter"],
  csm: ["Chainsaw Man"],
  sao: ["Sword Art Online"],
  tbhk: ["Toilet-bound Hanako-kun", "Jibaku Shounen Hanako-kun"],
  haikyuu: ["Haikyuu!!", "Haikyu!!"],
  haikyu: ["Haikyuu!!", "Haikyu!!"],
  ds: ["Demon Slayer", "Kimetsu no Yaiba"],
  kny: ["Kimetsu no Yaiba", "Demon Slayer"],
  op: ["One Piece"],
  dbz: ["Dragon Ball Z"],
  db: ["Dragon Ball"],
  dbs: ["Dragon Ball Super"],
  jojo: ["JoJo"],
  mob: ["Mob Psycho"],
  mp100: ["Mob Psycho 100"],
  rezero: ["Re:Zero"],
  kon: ["K-On!", "K-ON!"],
  yurucamp: ["Yuru Camp"],
  frieren: ["Sousou no Frieren", "Frieren"],
  bocchi: ["Bocchi the Rock"],
  spyfam: ["Spy x Family", "Spy X Family"],
  spxfamily: ["Spy x Family", "Spy X Family"],
  steins: ["Steins;Gate"],
  "s;g": ["Steins;Gate"],
  codegeass: ["Code Geass"],
  cg: ["Code Geass"],
  eva: ["Neon Genesis Evangelion", "Evangelion"],
  nge: ["Neon Genesis Evangelion"],
  madoka: ["Puella Magi Madoka Magica", "Madoka Magica"],
  pmmm: ["Puella Magi Madoka Magica"],
  monogatari: ["Monogatari"],
  bakemonogatari: ["Bakemonogatari"],
  oregairu: ["Oregairu", "My Teen Romantic Comedy"],
  aobuta: ["Seishun Buta Yarou", "Rascal Does Not Dream"],
  violet: ["Violet Evergarden"],
  ve: ["Violet Evergarden"],
  slime: ["Tensei shitara Slime", "That Time I Got Reincarnated as a Slime"],
  tensura: ["Tensei shitara Slime", "That Time I Got Reincarnated as a Slime"],
  shield: ["Tate no Yuusha", "Rising of the Shield Hero"],
  tate: ["Tate no Yuusha", "Rising of the Shield Hero"],
  overlord: ["Overlord"],
  konosuba: ["KonoSuba", "Konosuba"],
  gits: ["Ghost in the Shell"],
  gitst: ["Ghost in the Shell"],
  beb: ["Cowboy Bebop"],
  cb: ["Cowboy Bebop"],
  trigun: ["Trigun"],
  hellsing: ["Hellsing"],
  bluelock: ["Blue Lock"],
  aoashi: ["Ao Ashi"],
  jujutsu0: ["Jujutsu Kaisen 0"],
};

export function isLikelyAcronym(query: string): boolean {
  return /^[a-z0-9:;]{2,10}$/i.test(query);
}

/** Build acronym variants from a title (e.g. "Attack on Titan" → "aot"). */
export function acronymFromTitle(title: string): string {
  return title
    .replace(/[^\w\s:;]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !ACRONYM_STOP_WORDS.has(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toLowerCase();
}

/** All searchable terms for a query: the raw query plus any alias expansions. */
export function expandTitleSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const key = trimmed.toLowerCase();
  const aliases = TITLE_ALIASES[key] ?? [];
  return [...new Set<string>([trimmed, ...aliases])];
}

export function titleMatchesAcronym(titles: readonly string[], acronym: string): boolean {
  const key = acronym.toLowerCase();
  return titles.some((title) => acronymFromTitle(title) === key);
}
