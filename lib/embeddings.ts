import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const EMBEDDING_DIMS = 1536;

/** Parse a pgvector column value into a validated float array. */
export function parsePgVector(value: unknown): number[] | null {
  if (value == null) return null;

  let values: number[];
  if (Array.isArray(value)) {
    values = value.map((n) => Number(n));
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
    values = trimmed.slice(1, -1).split(",").map((n) => Number(n.trim()));
  } else {
    return null;
  }

  if (values.length !== EMBEDDING_DIMS) return null;
  if (values.some((n) => !Number.isFinite(n))) return null;
  return values;
}

export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    results.push(...response.data.map((d) => d.embedding));
  }
  return results;
}

export function getAnimeEmbeddingText(anime: {
  title: string;
  titleEnglish?: string | null;
  genres: string[];
  description?: string | null;
  format?: string | null;
  season?: string | null;
  seasonYear?: number | null;
}): string {
  const parts = [
    `Title: ${anime.titleEnglish ?? anime.title}`,
    `Genres: ${anime.genres.join(", ")}`,
    anime.format ? `Format: ${anime.format}` : "",
    anime.season && anime.seasonYear ? `Season: ${anime.season} ${anime.seasonYear}` : "",
    anime.description
      ? `Description: ${anime.description.replace(/<[^>]*>/g, "").slice(0, 500)}`
      : "",
  ];
  return parts.filter(Boolean).join(". ");
}
