/** Dicebear Glyphs avatar URL for persistence / server-side img src. */
export function getAvatarUrl(seed: string, size = 128): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: "1b1b1e",
    backgroundType: "solid",
    radius: "50",
    size: String(size),
  });
  return `https://api.dicebear.com/10.x/glyphs/svg?${params.toString()}`;
}

/** Raster (PNG) variant for renderers that can't embed SVG data URIs, e.g. @vercel/og. */
export function getAvatarPngUrl(seed: string, size = 128): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: "1b1b1e",
    backgroundType: "solid",
    radius: "0",
    size: String(size),
  });
  return `https://api.dicebear.com/10.x/glyphs/png?${params.toString()}`;
}

export function getAvatarSeed(username: string | null | undefined, userId: string): string {
  return username?.trim() || userId;
}
