import { prisma } from "@/lib/prisma";
import { searchMedia } from "@/lib/anilist";

export interface DescriptorConfig {
  genres?: string[];
  tags?: string[];
  /** Expanded phrase for semantic embedding — raw words like "sad" are too vague alone. */
  semanticQuery: string;
}

interface DescriptorResult {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
  format: string | null;
  type: string;
  similarity: number;
  source: "anilist";
}

/**
 * Maps colloquial / mood / genre shorthand to AniList filters + semantic text.
 * Keys are lowercase single words only.
 */
const DESCRIPTORS: Record<string, DescriptorConfig> = {
  // Moods & vibes
  sad: { genres: ["Drama"], semanticQuery: "sad melancholic emotional heartbreaking tragic anime" },
  scary: { genres: ["Horror"], semanticQuery: "scary horror frightening creepy unsettling anime" },
  funny: { genres: ["Comedy"], semanticQuery: "funny comedy hilarious humor anime" },
  cozy: { genres: ["Slice of Life"], semanticQuery: "cozy warm comforting slice of life anime" },
  dark: { genres: ["Horror", "Psychological"], semanticQuery: "dark grim psychological horror anime" },
  wholesome: { genres: ["Slice of Life", "Comedy"], semanticQuery: "wholesome heartwarming feel-good anime" },

  // AniList genres (normalized spelling)
  horror: { genres: ["Horror"], semanticQuery: "horror scary dark creepy anime" },
  sports: { genres: ["Sports"], semanticQuery: "sports competition athletic team anime" },
  romance: { genres: ["Romance"], semanticQuery: "romance love relationship anime" },
  action: { genres: ["Action"], semanticQuery: "action battle fighting intense anime" },
  comedy: { genres: ["Comedy"], semanticQuery: "comedy funny humorous anime" },
  drama: { genres: ["Drama"], semanticQuery: "drama emotional character-driven anime" },
  fantasy: { genres: ["Fantasy"], semanticQuery: "fantasy magic adventure world-building anime" },
  scifi: { genres: ["Sci-Fi"], semanticQuery: "sci-fi science fiction futuristic space anime" },
  "sci-fi": { genres: ["Sci-Fi"], semanticQuery: "sci-fi science fiction futuristic space anime" },
  supernatural: { genres: ["Supernatural"], semanticQuery: "supernatural spirits paranormal anime" },
  thriller: { genres: ["Thriller"], semanticQuery: "thriller suspense tension mystery anime" },
  mystery: { genres: ["Mystery"], semanticQuery: "mystery detective puzzle investigation anime" },
  psychological: { genres: ["Psychological"], semanticQuery: "psychological mind games twisted anime" },
  mecha: { genres: ["Mecha"], semanticQuery: "mecha robots giant robots pilot anime" },
  music: { genres: ["Music"], semanticQuery: "music band idol concert performance anime" },
  slice: { genres: ["Slice of Life"], semanticQuery: "slice of life everyday peaceful anime" },

  // Thematic shorthand
  ghost: { genres: ["Supernatural", "Horror"], semanticQuery: "ghost spirits supernatural paranormal anime" },
  ghosts: { genres: ["Supernatural", "Horror"], semanticQuery: "ghost spirits supernatural paranormal anime" },
  cars: { semanticQuery: "racing cars driving motorsport street racing anime" },
  car: { semanticQuery: "racing cars driving motorsport street racing anime" },
  racing: { semanticQuery: "racing cars driving motorsport competition anime" },
  school: { semanticQuery: "high school student campus school life anime" },
  war: { semanticQuery: "war military battlefield conflict anime" },
  magic: { genres: ["Fantasy"], semanticQuery: "magic wizards spells fantasy anime" },
  witch: { genres: ["Fantasy"], semanticQuery: "witch witches magic fantasy anime" },
  witches: { genres: ["Fantasy"], semanticQuery: "witch witches magic fantasy anime" },
  vampire: { genres: ["Supernatural", "Horror"], semanticQuery: "vampire supernatural dark romance anime" },
  vampires: { genres: ["Supernatural", "Horror"], semanticQuery: "vampire supernatural dark romance anime" },
  space: { genres: ["Sci-Fi"], semanticQuery: "space sci-fi cosmic adventure anime" },
  robot: { genres: ["Mecha", "Sci-Fi"], semanticQuery: "robot mecha sci-fi anime" },
  robots: { genres: ["Mecha", "Sci-Fi"], semanticQuery: "robot mecha sci-fi anime" },

  // LGBTQ+ — AniList tags, not genres
  gay: { tags: ["Boys Love", "Yuri"], semanticQuery: "boys love yuri LGBTQ queer gay lesbian romance anime" },
  lesbian: { tags: ["Yuri", "Girls Love"], semanticQuery: "yuri girls love lesbian romance anime" },
  yuri: { tags: ["Yuri", "Girls Love"], semanticQuery: "yuri girls love lesbian romance anime" },
  bl: { tags: ["Boys Love"], semanticQuery: "boys love BL gay romance anime" },
};

export function resolveDescriptor(query: string): DescriptorConfig | null {
  const trimmed = query.trim();
  if (!trimmed || trimmed.split(/\s+/).length !== 1) return null;
  return DESCRIPTORS[trimmed.toLowerCase()] ?? null;
}

function mediaToHybridResults(
  media: Array<{
    id: number;
    title: { romaji: string | null; english: string | null };
    coverImage: { large: string | null; extraLarge: string | null };
    genres: string[];
    averageScore: number | null;
    format: string | null;
    type: string;
  }>,
): DescriptorResult[] {
  return media.map((item) => ({
    id: item.id,
    title: item.title.romaji ?? item.title.english ?? "",
    titleEnglish: item.title.english ?? null,
    coverImage: item.coverImage.extraLarge ?? item.coverImage.large ?? null,
    genres: item.genres,
    averageScore: item.averageScore,
    format: item.format,
    type: item.type,
    similarity: 0.55,
    source: "anilist" as const,
  }));
}

async function searchLocalByGenres(
  genres: string[],
  type: "ANIME" | "MANGA",
  limit: number,
): Promise<DescriptorResult[]> {
  const rows = await prisma.anime.findMany({
    where: { type, genres: { hasSome: genres } },
    orderBy: { popularity: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      titleEnglish: true,
      coverImage: true,
      genres: true,
      averageScore: true,
      format: true,
      type: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    similarity: 0.55,
    source: "anilist" as const,
  }));
}

/** Fetch popular titles matching descriptor genre/tag filters. */
export async function searchDescriptorFilters(
  descriptor: DescriptorConfig,
  type: "ANIME" | "MANGA",
  limit: number,
): Promise<DescriptorResult[]> {
  if (!descriptor.genres?.length && !descriptor.tags?.length) return [];

  try {
    const page = await searchMedia("", type, {
      genres: descriptor.genres,
      tags: descriptor.tags,
    }, 1, limit);
    if (page.media.length > 0) return mediaToHybridResults(page.media);
  } catch (err) {
    console.error("Descriptor AniList filter search failed:", err);
  }

  if (descriptor.genres?.length) {
    try {
      return await searchLocalByGenres(descriptor.genres, type, limit);
    } catch (err) {
      console.error("Descriptor local genre search failed:", err);
    }
  }

  return [];
}
