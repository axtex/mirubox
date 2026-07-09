import { NextRequest, NextResponse } from "next/server";
import { searchMedia, getDisplayTitle } from "@/lib/anilist";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const typeParam = searchParams.get("type")?.toUpperCase();
  const type = typeParam === "MANGA" ? "MANGA" : "ANIME";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const page = await searchMedia(q, type, {}, 1, 10);

  const results = page.media.map((m) => ({
    id: m.id,
    title: getDisplayTitle(m.title),
    coverImage: m.coverImage.large ?? m.coverImage.extraLarge,
    format: m.format,
    seasonYear: m.seasonYear,
    type: m.type,
  }));

  return NextResponse.json({ results });
}
