/** Dicebear Glyphs avatar URL for persistence / server-side img src. */
export function getAvatarUrl(seed: string, size = 128): string {
  const params = new URLSearchParams({
    seed,
    size: String(size),
    borderRadius: "0",
  });
  return `https://api.dicebear.com/10.x/glyphs/png?${params.toString()}`;
}

export function getAvatarSeed(username: string | null | undefined, userId: string): string {
  return username?.trim() || userId;
}
