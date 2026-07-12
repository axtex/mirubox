import { getRankColors } from "@/lib/rank-colors";
import { hexToRgba } from "@/lib/color";
import type { PassportCardProps } from "@/components/profile/PassportCard";

// Mirrors PassportCard.tsx visually, but using inline styles only (no CSS vars,
// no className) since @vercel/og (satori) can't resolve external CSS or var().
// Keep this in sync with PassportCard.tsx when the design changes.
//
// Rendered at 2× so the downloaded PNG stays sharp on retina displays.

export const PASSPORT_OG_SCALE = 2;
export const PASSPORT_OG_WIDTH = 400 * PASSPORT_OG_SCALE;
/** Tall enough for full card + dividers; avoid clipping the bottom strip. */
export const PASSPORT_OG_HEIGHT = 980 * PASSPORT_OG_SCALE;

const ACCENT = "#e8173f";
const FG = "#e4e1e6";
const FG_SUBTLE = "#5a5a65";
const FG_FAINT = "#3a3a45";
const BG_ELEVATED = "#1b1b1e";
const BG_CARD_HIGH = "#2a2a2d";

const POSTER_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150">' +
      '<rect width="100%" height="100%" fill="#1b1b1e"/></svg>'
  );

const AVATAR_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
      '<rect width="100%" height="100%" fill="#1b1b1e"/></svg>'
  );

const GENRE_FILL_COLORS = ["#534AB7", "#1d9e75", "#BA7517", "rgba(255,255,255,0.2)"];

const S = PASSPORT_OG_SCALE;
const CONTENT_WIDTH = (400 - 18 * 2) * S;
const POSTER_GAP = 5 * S;
const POSTER_WIDTH = Math.round((CONTENT_WIDTH - POSTER_GAP * 2) / 3);
const POSTER_HEIGHT = Math.round(POSTER_WIDTH * 1.5);

function sectionLabel(text: string): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "SpaceMono",
        fontSize: 7 * S,
        color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase",
        letterSpacing: 1 * S,
        marginBottom: 6 * S,
      }}
    >
      {text}
    </div>
  );
}

function PosterRow({
  items,
}: {
  items: { title: string; coverImage: string }[];
}): React.JSX.Element {
  const slots = [...items.slice(0, 3)];
  while (slots.length < 3) slots.push({ title: "", coverImage: "" });

  return (
    <div style={{ display: "flex", gap: POSTER_GAP, marginBottom: 6 * S }}>
      {slots.map((slot, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            borderRadius: 3 * S,
            border: `${1 * S}px solid rgba(255,255,255,0.06)`,
            overflow: "hidden",
            background: BG_ELEVATED,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the DOM */}
          <img
            src={slot.coverImage || POSTER_FALLBACK}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
            style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, objectFit: "cover" }}
          />
        </div>
      ))}
    </div>
  );
}

export function PassportCardOG({
  username,
  displayName,
  avatarUrl,
  rank,
  currentXP,
  stats,
  favouriteAnime,
  favouriteManga,
  tasteProfile,
  badges,
}: PassportCardProps): React.JSX.Element {
  const { bgStart } = getRankColors(rank.name);
  const accent = ACCENT;
  const maxTasteCount = tasteProfile[0]?.count ?? 1;
  const shownBadges = [...badges].slice(0, 6);
  const avatarSize = 62 * S;
  const corner = 44 * S;
  const cornerBorder = `${1.5 * S}px solid ${accent}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: PASSPORT_OG_WIDTH,
        height: PASSPORT_OG_HEIGHT,
        background: `linear-gradient(160deg, ${bgStart} 0%, #0f0f12 50%, #0a1218 100%)`,
        border: `${1 * S}px solid ${hexToRgba(accent, 0.2)}`,
        borderRadius: 8 * S,
        fontFamily: "SpaceMono",
        position: "relative",
        color: FG,
      }}
    >
      {/* Corner accents */}
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: corner, height: corner, borderTop: cornerBorder, borderLeft: cornerBorder, borderTopLeftRadius: 8 * S }} />
      <div style={{ display: "flex", position: "absolute", top: 0, right: 0, width: corner, height: corner, borderTop: cornerBorder, borderRight: cornerBorder, borderTopRightRadius: 8 * S }} />
      <div style={{ display: "flex", position: "absolute", bottom: 0, left: 0, width: corner, height: corner, borderBottom: cornerBorder, borderLeft: cornerBorder, borderBottomLeftRadius: 8 * S }} />
      <div style={{ display: "flex", position: "absolute", bottom: 0, right: 0, width: corner, height: corner, borderBottom: cornerBorder, borderRight: cornerBorder, borderBottomRightRadius: 8 * S }} />

      {/* Subtle glow */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -60 * S,
          left: -60 * S,
          width: 200 * S,
          height: 200 * S,
          background: `radial-gradient(circle, ${hexToRgba(accent, 0.08)} 0%, transparent 70%)`,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${18 * S}px ${18 * S}px 0` }}>
        {/* Brand row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 * S }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "SpaceMono", fontWeight: 700, fontSize: 15 * S, lineHeight: 1 }}>
            <span style={{ color: FG }}>miru</span>
            <span style={{ color: ACCENT }}>box</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "SpaceMono", fontSize: 10 * S, lineHeight: 1, color: "rgba(255,255,255,0.2)", letterSpacing: 1 * S, textTransform: "uppercase" }}>
            Taste Passport
          </div>
        </div>

        {/* Identity row */}
        <div style={{ display: "flex", gap: 13 * S, marginBottom: 14 * S }}>
          <div
            style={{
              display: "flex",
              width: avatarSize,
              height: avatarSize,
              borderRadius: 2 * S,
              border: `${2 * S}px solid ${hexToRgba(accent, 0.35)}`,
              boxShadow: `0 0 ${24 * S}px ${hexToRgba(accent, 0.12)}`,
              overflow: "hidden",
              background: BG_ELEVATED,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the DOM */}
            <img
              src={avatarUrl || AVATAR_FALLBACK}
              width={avatarSize}
              height={avatarSize}
              style={{ width: avatarSize, height: avatarSize, objectFit: "cover" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: avatarSize }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 11 * S, color: FG_SUBTLE, marginBottom: 2 * S }}>
                @{username}
              </div>
              <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 19 * S, fontWeight: 700, color: FG }}>
                {displayName}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                fontFamily: "SpaceMono",
                fontSize: 8 * S,
                fontWeight: 700,
                color: ACCENT,
                background: BG_ELEVATED,
                border: `${1 * S}px solid ${BG_CARD_HIGH}`,
                borderRadius: 2 * S,
                padding: `${2 * S}px ${5 * S}px`,
              }}
            >
              {rank.name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: 1 * S, background: "rgba(255,255,255,0.05)", marginBottom: 14 * S }} />

        {/* Stats strip */}
        <div style={{ display: "flex", marginBottom: 14 * S }}>
          {[
            { label: "Watched", value: stats.watched },
            { label: "Read", value: stats.read },
            { label: "Rated", value: stats.rated },
            { label: "Lists", value: stats.lists },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                borderLeft: i === 0 ? "none" : `${1 * S}px solid rgba(255,255,255,0.05)`,
              }}
            >
              <div style={{ display: "flex", fontSize: 18 * S, fontWeight: 700, color: FG, marginBottom: 2 * S }}>{s.value}</div>
              <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 7 * S, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1 * S }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", height: 1 * S, background: "rgba(255,255,255,0.05)", marginBottom: 14 * S }} />

        {/* Fav anime */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sectionLabel("Top 3 Anime")}
          <PosterRow items={favouriteAnime} />
        </div>

        {/* Fav manga */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 * S }}>
          {sectionLabel("Top 3 Manga")}
          <PosterRow items={favouriteManga} />
        </div>

        <div style={{ display: "flex", height: 1 * S, background: "rgba(255,255,255,0.05)", marginTop: 14 * S, marginBottom: 14 * S }} />

        {/* Taste profile */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 * S }}>
          {sectionLabel("Taste Profile")}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 * S }}>
            {tasteProfile.map((g, i) => (
              <div key={g.genre} style={{ display: "flex", alignItems: "center", gap: 8 * S }}>
                <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 8 * S, color: "rgba(255,255,255,0.4)", width: 80 * S }}>
                  {g.genre}
                </div>
                <div style={{ display: "flex", flex: 1, height: 2 * S, background: "rgba(255,255,255,0.05)", borderRadius: 1 * S }}>
                  <div
                    style={{
                      display: "flex",
                      height: 2 * S,
                      borderRadius: 1 * S,
                      width: `${(g.count / maxTasteCount) * 100}%`,
                      background: i === 0 ? accent : (GENRE_FILL_COLORS[i - 1] ?? GENRE_FILL_COLORS[3]),
                    }}
                  />
                </div>
                <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 8 * S, color: "rgba(255,255,255,0.15)" }}>
                  {g.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", height: 1 * S, background: "rgba(255,255,255,0.05)", marginBottom: 14 * S }} />

        {/* Badges */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 * S }}>
          {sectionLabel("Badges")}
          <div style={{ display: "flex", gap: 8 * S }}>
            {shownBadges.map((badge) => (
              <div key={badge.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 * S }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42 * S,
                    height: 42 * S,
                    borderRadius: 2 * S,
                    background: badge.earned ? "rgba(232,23,63,0.1)" : BG_ELEVATED,
                    border: badge.earned ? `${1.5 * S}px solid rgba(232,23,63,0.4)` : `${1 * S}px solid ${BG_CARD_HIGH}`,
                    fontSize: badge.earned ? 16 * S : 12 * S,
                    color: badge.earned ? FG : FG_FAINT,
                  }}
                >
                  {badge.earned ? badge.emoji : "\u{1F512}"}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "SpaceMono",
                    fontSize: 7 * S,
                    textAlign: "center",
                    maxWidth: 52 * S,
                    color: badge.earned ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)",
                  }}
                >
                  {badge.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `${1 * S}px solid rgba(255,255,255,0.05)`,
          padding: `${9 * S}px ${18 * S}px`,
        }}
      >
        <div style={{ display: "flex", fontFamily: "SpaceMono", fontSize: 8 * S, color: "rgba(255,255,255,0.18)" }}>
          <span style={{ color: hexToRgba(accent, 0.6) }}>mirubox</span>.vercel.app/u/{username}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "SpaceMono",
            fontSize: 8 * S,
            color: "rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.04)",
            border: `${1 * S}px solid rgba(255,255,255,0.07)`,
            borderRadius: 2 * S,
            padding: `${2 * S}px ${7 * S}px`,
          }}
        >
          {currentXP} XP
        </div>
      </div>
    </div>
  );
}
