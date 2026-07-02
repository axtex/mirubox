/**
 * Seed the read-before-you-watch manga list with correct IDs via search.
 * Run: npx tsx --env-file .env.local scripts/seed-manga-list.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GraphQLClient, gql } from "graphql-request";

const connStr = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });
const anilist = new GraphQLClient("https://graphql.anilist.co");

const SEARCH = gql`
  query S($s: String, $t: MediaType) {
    Media(search: $s, type: $t, sort: SEARCH_MATCH) {
      id title { romaji english }
      coverImage { large extraLarge }
      bannerImage genres chapters volumes status season seasonYear
      averageScore popularity format type episodes
    }
  }
`;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function search(title: string, type: "ANIME" | "MANGA", attempt = 0): Promise<{id:number;title:{romaji:string|null;english:string|null};coverImage:{large:string|null;extraLarge:string|null};bannerImage:string|null;genres:string[];chapters:number|null;volumes:number|null;status:string|null;season:string|null;seasonYear:number|null;averageScore:number|null;popularity:number|null;format:string|null;type:string;episodes:number|null} | null> {
  try {
    const d = await anilist.request<{Media:{id:number;title:{romaji:string|null;english:string|null};coverImage:{large:string|null;extraLarge:string|null};bannerImage:string|null;genres:string[];chapters:number|null;volumes:number|null;status:string|null;season:string|null;seasonYear:number|null;averageScore:number|null;popularity:number|null;format:string|null;type:string;episodes:number|null}}>(SEARCH, { s: title, t: type });
    return d.Media;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if ((msg.includes("429") || msg.includes("Too Many")) && attempt < 3) {
      const wait = 8000 * (attempt + 1);
      console.log(`Rate limited, waiting ${wait/1000}s...`);
      await sleep(wait);
      return search(title, type, attempt + 1);
    }
    console.warn(`  ⚠ Not found: "${title}"`);
    return null;
  }
}

async function main() {
  const list = await prisma.list.findUnique({ where: { slug: "read-before-you-watch" } });
  if (!list) { console.error("List not found"); return; }

  const titles = [
    "Berserk",
    "Vagabond",
    "Chainsaw Man",
    "Jujutsu Kaisen",
    "Vinland Saga",
    "Dungeon Meshi",
    "Oyasumi Punpun",
    "Tokyo Ghoul",
    "Homunculus",
  ];

  let order = 0;
  for (const title of titles) {
    process.stdout.write(`  → "${title}" ... `);
    const media = await search(title, "MANGA");
    await sleep(2500); // extra long delay

    if (!media) continue;

    await prisma.anime.upsert({
      where: { id: media.id },
      create: {
        id: media.id,
        title: media.title.romaji ?? media.title.english ?? "Unknown",
        titleEnglish: media.title.english,
        coverImage: media.coverImage.extraLarge ?? media.coverImage.large,
        bannerImage: media.bannerImage,
        genres: media.genres,
        chapters: media.chapters,
        volumes: media.volumes,
        episodes: media.episodes,
        status: media.status,
        season: media.season,
        seasonYear: media.seasonYear,
        averageScore: media.averageScore,
        popularity: media.popularity,
        format: media.format,
        type: media.type,
      },
      update: { coverImage: media.coverImage.extraLarge ?? media.coverImage.large, averageScore: media.averageScore },
    });

    await prisma.listEntry.upsert({
      where: { listId_mediaId: { listId: list.id, mediaId: media.id } },
      create: { listId: list.id, mediaId: media.id, mediaType: "MANGA", order },
      update: { order },
    });

    console.log(`✓ ID ${media.id} — ${media.title.english ?? media.title.romaji}`);
    order++;
  }

  const count = await prisma.listEntry.count({ where: { listId: list.id } });
  console.log(`\n✅ read-before-you-watch: ${count} entries`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
