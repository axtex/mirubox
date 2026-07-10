/**
 * Seed official curated lists using hardcoded AniList IDs.
 * Run: npx tsx --env-file .env.local scripts/seed-lists.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GraphQLClient, gql } from "graphql-request";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const anilist = new GraphQLClient("https://graphql.anilist.co");

interface AnilistMedia {
  id: number;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { large: string | null; extraLarge: string | null };
  bannerImage: string | null;
  genres: string[];
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity: number | null;
  format: string | null;
  type: string;
}

const FETCH_BY_ID = gql`
  query GetMedia($id: Int) {
    Media(id: $id) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      genres
      episodes
      chapters
      volumes
      status
      season
      seasonYear
      averageScore
      popularity
      format
      type
    }
  }
`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchById(id: number, attempt = 0): Promise<AnilistMedia | null> {
  try {
    const data = await anilist.request<{ Media: AnilistMedia }>(FETCH_BY_ID, { id });
    return data.Media ?? null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("Too Many") || msg.includes("rate")) {
      if (attempt < 4) {
        const wait = 5000 * (attempt + 1);
        console.warn(`\n  ⏳ Rate limited. Waiting ${wait / 1000}s...`);
        await sleep(wait);
        return fetchById(id, attempt + 1);
      }
    }
    console.warn(`  ⚠ Could not fetch ID ${id}: ${msg.slice(0, 80)}`);
    return null;
  }
}

async function upsertMedia(media: AnilistMedia): Promise<void> {
  await prisma.anime.upsert({
    where: { id: media.id },
    create: {
      id: media.id,
      title: media.title.romaji ?? media.title.english ?? "Unknown",
      titleEnglish: media.title.english ?? null,
      titleNative: media.title.native ?? null,
      coverImage: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
      bannerImage: media.bannerImage ?? null,
      genres: media.genres ?? [],
      episodes: media.episodes ?? null,
      chapters: media.chapters ?? null,
      volumes: media.volumes ?? null,
      status: media.status ?? null,
      season: media.season ?? null,
      seasonYear: media.seasonYear ?? null,
      averageScore: media.averageScore ?? null,
      popularity: media.popularity ?? null,
      format: media.format ?? null,
      type: media.type ?? "ANIME",
    },
    update: {
      coverImage: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
      averageScore: media.averageScore ?? null,
      popularity: media.popularity ?? null,
    },
  });
}

interface OfficialList {
  slug: string;
  title: string;
  description: string;
  mediaType: "ANIME" | "MANGA";
  ids: number[];
}

const OFFICIAL_LISTS: OfficialList[] = [
  {
    slug: "slow-burn-masterpieces",
    title: "Slow Burn Masterpieces",
    description:
      "The kind of anime that earns every emotional payoff. Patient, deliberate, unforgettable. These are the ones people talk about years later.",
    mediaType: "ANIME",
    ids: [
      170068, // Frieren: Beyond Journey's End
      21366,  // March Comes in Like a Lion
      457,    // Mushishi
      101348, // Vinland Saga
      4181,   // Clannad: After Story
      100388, // Banana Fish
      21711,  // 91 Days
      4081,   // Natsume's Book of Friends
      20954,  // A Silent Voice
      101974, // Fruits Basket (2019)
      20665,  // Your Lie in April
      20722,  // Barakamon
      108617, // Somali and the Forest Spirit
    ],
  },
  {
    slug: "adrenaline-rush",
    title: "Adrenaline Rush",
    description: "Kinetic, high-stakes, legendary. These don't let you breathe.",
    mediaType: "ANIME",
    ids: [
      16498,  // Attack on Titan
      101922, // Demon Slayer
      113415, // Jujutsu Kaisen
      11061,  // Hunter x Hunter (2011)
      5114,   // Fullmetal Alchemist: Brotherhood
      21507,  // Mob Psycho 100
      127230, // Chainsaw Man
      97940,  // Black Clover
      21459,  // My Hero Academia
      20464,  // Haikyu!!
      2001,   // Tengen Toppa Gurren Lagann
    ],
  },
  {
    slug: "late-night-mood",
    title: "Late Night Mood",
    description: "2am and something feels off. These understand.",
    mediaType: "ANIME",
    ids: [
      339,    // Serial Experiments Lain
      101283, // Boogiepop and Others
      323,    // Paranoia Agent
      437,    // Perfect Blue
      26,     // Texhnolyze
      790,    // Ergo Proxy
      367,    // Haibane Renmei
      572,    // Ghost in the Shell (1995)
      5081,   // Bakemonogatari
      7785,   // The Tatami Galaxy
    ],
  },
  {
    slug: "films-worth-your-evening",
    title: "Films Worth Your Evening",
    description: "One sitting. Full commitment. Worth every minute.",
    mediaType: "ANIME",
    ids: [
      21519, // Your Name.
      20954, // A Silent Voice
      199,   // Spirited Away
      164,   // Princess Mononoke
      1291,  // Paprika
      47,    // Akira
      12355, // Wolf Children
      14745, // The Garden of Words
      784,   // Nausicaä of the Valley of the Wind
      578,   // Grave of the Fireflies
      19815, // The Tale of Princess Kaguya
    ],
  },
  {
    slug: "start-here",
    title: "Start Here",
    description:
      "The best entry points into anime. Picked for people who aren't sure where to begin.",
    mediaType: "ANIME",
    ids: [
      5114,   // Fullmetal Alchemist: Brotherhood
      16498,  // Attack on Titan
      1535,   // Death Note
      21519,  // Your Name.
      101922, // Demon Slayer
      30276,  // One Punch Man
      199,    // Spirited Away
      20464,  // Haikyu!!
      11061,  // Hunter x Hunter (2011)
      21827,  // Violet Evergarden
    ],
  },
  {
    slug: "certified-endings",
    title: "Certified Endings",
    description: "Series that actually stuck the landing. Rare. Save these.",
    mediaType: "ANIME",
    ids: [
      5114,   // Fullmetal Alchemist: Brotherhood
      32,     // End of Evangelion
      2001,   // Gurren Lagann
      9253,   // Steins;Gate
      1575,   // Code Geass
      20755,  // Assassination Classroom
      101348, // Vinland Saga
      21711,  // 91 Days
      100388, // Banana Fish
    ],
  },
  {
    slug: "read-before-you-watch",
    title: "Read Before You Watch",
    description:
      "The manga that started it all. Worth experiencing before the adaptation.",
    mediaType: "MANGA",
    ids: [
      30002,  // Berserk
      30013,  // Vagabond
      87699,  // Chainsaw Man (manga)
      87789,  // Jujutsu Kaisen (manga)
      53390,  // Vinland Saga (manga)
      85877,  // Dungeon Meshi (manga)
      30022,  // Oyasumi Punpun
      46470,  // Tokyo Ghoul (manga)
      30072,  // Homunculus
    ],
  },
  {
    slug: "comfort-rewatches",
    title: "Comfort Rewatches",
    description:
      "Soft, warm, and endlessly rewatchable. The ones you put on when you need something familiar.",
    mediaType: "ANIME",
    ids: [
      10165,  // Nichijou
      20812,  // Shirobako
      2167,   // Clannad
      4224,   // Toradora!
      12189,  // Hyouka
      111762, // Fruits Basket Season 2
      5680,   // K-On!
      21827,  // Violet Evergarden
      98444,  // Laid-Back Camp
      21284,  // Flying Witch
      20722,  // Barakamon
    ],
  },
];

let requestCount = 0;

async function throttledFetch(id: number): Promise<AnilistMedia | null> {
  requestCount++;
  // Every 15 requests, pause 8s to avoid rate limit burst
  if (requestCount > 1 && requestCount % 15 === 1) {
    process.stdout.write(`\n  ⏸ Cooldown (req #${requestCount})... `);
    await sleep(8000);
    console.log("resuming");
  }
  const result = await fetchById(id);
  await sleep(1200);
  return result;
}

async function main(): Promise<void> {
  console.log("🌱 Seeding official lists...\n");

  for (const listDef of OFFICIAL_LISTS) {
    console.log(`📋 ${listDef.title}`);

    const list = await prisma.list.upsert({
      where: { slug: listDef.slug },
      create: {
        slug: listDef.slug,
        title: listDef.title,
        description: listDef.description,
        isOfficial: true,
        isPublic: true,
        userId: null,
      },
      update: {
        title: listDef.title,
        description: listDef.description,
      },
    });

    // Check which entries already exist (skip re-fetching those)
    const existing = await prisma.listEntry.findMany({
      where: { listId: list.id },
      select: { mediaId: true },
    });
    const existingIds = new Set(existing.map((e) => e.mediaId));

    let order = existing.length;
    for (const mediaId of listDef.ids) {
      if (existingIds.has(mediaId)) {
        process.stdout.write(`  → ID ${mediaId} ... already seeded\n`);
        // Still fix order
        await prisma.listEntry.updateMany({
          where: { listId: list.id, mediaId },
          data: { order: listDef.ids.indexOf(mediaId) },
        });
        continue;
      }

      process.stdout.write(`  → ID ${mediaId} ... `);
      const media = await throttledFetch(mediaId);

      if (!media) {
        console.log("skipped");
        continue;
      }

      await upsertMedia(media);

      await prisma.listEntry.upsert({
        where: { listId_mediaId: { listId: list.id, mediaId: media.id } },
        create: {
          listId: list.id,
          mediaId: media.id,
          mediaType: listDef.mediaType,
          order: listDef.ids.indexOf(mediaId),
        },
        update: { order: listDef.ids.indexOf(mediaId) },
      });

      const displayTitle = media.title.english ?? media.title.romaji ?? String(mediaId);
      console.log(`✓ ${displayTitle}`);
      order++;
    }

    console.log(`  ✅ Done\n`);
  }

  console.log("✨ Complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
