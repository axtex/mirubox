import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  mapMalStatus,
  mapScore,
  parseMalXml,
  type ImportResult,
  type MalEntry,
} from "@/lib/import-utils";
import type { AnimeCard } from "@/types/anilist";

export const maxDuration = 120;

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 700;

const MEDIA_BY_MAL_QUERY = `
  query ($malId: Int, $type: MediaType) {
    Media(idMal: $malId, type: $type) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      genres
      episodes
      chapters
      status
      season
      seasonYear
      averageScore
      popularity
      format
      type
      tags { name category }
      rankings { rank type allTime }
    }
  }
`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveMalToAniList(
  malId: number,
  type: "ANIME" | "MANGA",
): Promise<AnimeCard | null> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(ANILIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: MEDIA_BY_MAL_QUERY,
          variables: { malId, type },
        }),
      });

      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }

      const json = (await res.json()) as {
        data?: { Media: AnimeCard | null };
        errors?: unknown[];
      };
      return json.data?.Media ?? null;
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function importMalEntry(
  userId: string,
  entry: MalEntry,
): Promise<"imported" | "skipped" | "notFound"> {
  const mediaType = entry.type === "anime" ? "ANIME" : "MANGA";
  const media = await resolveMalToAniList(entry.malId, mediaType);
  if (!media) return "notFound";

  const existing = await prisma.trackerEntry.findUnique({
    where: { userId_animeId: { userId, animeId: media.id } },
  });
  if (existing) return "skipped";

  await cacheAnimeCard(media);

  await prisma.trackerEntry.create({
    data: {
      userId,
      animeId: media.id,
      status: mapMalStatus(entry.status),
      mediaType,
      progress: entry.progress,
    },
  });

  const mappedScore = mapScore(entry.score);
  if (mappedScore != null) {
    await prisma.rating.upsert({
      where: { userId_animeId: { userId, animeId: media.id } },
      create: { userId, animeId: media.id, score: mappedScore },
      update: { score: mappedScore },
    });
  }

  return "imported";
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`import:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!success) return rateLimitResponse();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const animeFile = formData.get("animeFile");
  const mangaFile = formData.get("mangaFile");

  const animeXml =
    animeFile instanceof File && animeFile.size > 0 ? await animeFile.text() : null;
  const mangaXml =
    mangaFile instanceof File && mangaFile.size > 0 ? await mangaFile.text() : null;

  let animeEntries: MalEntry[] = [];
  let mangaEntries: MalEntry[] = [];

  try {
    if (animeXml) animeEntries = parseMalXml(animeXml, "anime");
    if (mangaXml) mangaEntries = parseMalXml(mangaXml, "manga");
  } catch {
    return NextResponse.json({ error: "Failed to parse XML file" }, { status: 400 });
  }

  if (animeEntries.length === 0 && mangaEntries.length === 0) {
    return NextResponse.json(
      { error: "No entries found. Upload at least one valid MAL XML export." },
      { status: 400 },
    );
  }

  const all = [...animeEntries, ...mangaEntries];
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    notFound: 0,
    animeImported: 0,
    mangaImported: 0,
  };

  const userId = session.user.id;

  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const outcomes = await Promise.all(
      batch.map((entry) => importMalEntry(userId, entry)),
    );

    for (let j = 0; j < batch.length; j++) {
      const entry = batch[j]!;
      const outcome = outcomes[j]!;
      if (outcome === "imported") {
        result.imported++;
        if (entry.type === "anime") result.animeImported++;
        else result.mangaImported++;
      } else if (outcome === "skipped") {
        result.skipped++;
      } else {
        result.notFound++;
      }
    }

    if (i + BATCH_SIZE < all.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastMalImport: new Date() },
  });

  return NextResponse.json(result);
}
