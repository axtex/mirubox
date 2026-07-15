import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheAnimeCard } from "@/lib/anilist-cache";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  isValidAnilistUsername,
  mapAnilistStatus,
  mapScore,
  type ImportResult,
} from "@/lib/import-utils";
import type { AnimeCard } from "@/types/anilist";

export const maxDuration = 120;

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_QUERY = `
  query ($username: String) {
    anime: MediaListCollection(userName: $username, type: ANIME) {
      lists {
        entries {
          mediaId
          status
          score
          progress
        }
      }
    }
    manga: MediaListCollection(userName: $username, type: MANGA) {
      lists {
        entries {
          mediaId
          status
          score
          progress
        }
      }
    }
  }
`;

/** Card-sized payload for cacheAnimeCard — avoids heavy detail queries during bulk import. */
const MEDIA_CARD_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
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

async function fetchMediaCard(id: number): Promise<AnimeCard | null> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: MEDIA_CARD_QUERY, variables: { id } }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { Media: AnimeCard | null } };
  return json.data?.Media ?? null;
}

interface AnilistEntry {
  mediaId: number;
  status: string;
  score: number | null;
  progress: number | null;
}

interface AnilistListPayload {
  anime: { lists: { entries: AnilistEntry[] | null }[] } | null;
  manga: { lists: { entries: AnilistEntry[] | null }[] } | null;
}

function flattenEntries(
  collection: { lists: { entries: AnilistEntry[] | null }[] } | null,
): AnilistEntry[] {
  if (!collection?.lists) return [];
  const seen = new Set<number>();
  const out: AnilistEntry[] = [];
  for (const list of collection.lists) {
    for (const entry of list.entries ?? []) {
      if (!entry?.mediaId || seen.has(entry.mediaId)) continue;
      seen.add(entry.mediaId);
      out.push(entry);
    }
  }
  return out;
}

async function importOne(
  userId: string,
  entry: AnilistEntry,
  mediaType: "ANIME" | "MANGA",
): Promise<"imported" | "skipped" | "notFound"> {
  const existing = await prisma.trackerEntry.findUnique({
    where: { userId_animeId: { userId, animeId: entry.mediaId } },
  });
  if (existing) return "skipped";

  let media = await prisma.anime.findUnique({ where: { id: entry.mediaId } });
  if (!media) {
    try {
      const fetched = await fetchMediaCard(entry.mediaId);
      if (!fetched) return "notFound";
      await cacheAnimeCard(fetched);
      media = await prisma.anime.findUnique({ where: { id: entry.mediaId } });
      if (!media) return "notFound";
    } catch {
      return "notFound";
    }
  }

  await prisma.trackerEntry.create({
    data: {
      userId,
      animeId: entry.mediaId,
      status: mapAnilistStatus(entry.status),
      mediaType,
      progress: entry.progress ?? 0,
    },
  });

  const mappedScore = mapScore(entry.score);
  if (mappedScore != null) {
    await prisma.rating.upsert({
      where: { userId_animeId: { userId, animeId: entry.mediaId } },
      create: { userId, animeId: entry.mediaId, score: mappedScore },
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

  let body: { username?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body.username === "string" ? body.username.trim().replace(/^@/, "") : "";
  if (!isValidAnilistUsername(raw)) {
    return NextResponse.json(
      { error: "Invalid username. Use 2–20 letters, numbers, underscores, or hyphens." },
      { status: 400 },
    );
  }

  let data: AnilistListPayload;
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { username: raw } }),
    });
    const json = (await res.json()) as {
      data?: AnilistListPayload;
      errors?: { message?: string }[];
    };
    if (json.errors?.length) {
      const msg = json.errors[0]?.message?.toLowerCase() ?? "";
      if (msg.includes("not found") || msg.includes("user")) {
        return NextResponse.json({ error: "AniList user not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "AniList API error" }, { status: 502 });
    }
    if (!json.data) {
      return NextResponse.json({ error: "AniList user not found" }, { status: 404 });
    }
    data = json.data;
  } catch {
    return NextResponse.json({ error: "Failed to reach AniList" }, { status: 502 });
  }

  const animeEntries = flattenEntries(data.anime);
  const mangaEntries = flattenEntries(data.manga);

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    notFound: 0,
    animeImported: 0,
    mangaImported: 0,
  };

  for (const entry of animeEntries) {
    const outcome = await importOne(session.user.id, entry, "ANIME");
    if (outcome === "imported") {
      result.imported++;
      result.animeImported++;
    } else if (outcome === "skipped") {
      result.skipped++;
    } else {
      result.notFound++;
    }
  }

  for (const entry of mangaEntries) {
    const outcome = await importOne(session.user.id, entry, "MANGA");
    if (outcome === "imported") {
      result.imported++;
      result.mangaImported++;
    } else if (outcome === "skipped") {
      result.skipped++;
    } else {
      result.notFound++;
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      lastAnilistImport: new Date(),
      anilistUsername: raw,
    },
  });

  return NextResponse.json(result);
}
