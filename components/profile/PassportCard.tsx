import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getRankColors } from "@/lib/rank-colors";
import { hexToRgba } from "@/lib/color";

const ACCENT = "#e8173f";

export interface PassportCardProps {
  username: string;
  displayName: string;
  avatarUrl: string;
  rank: {
    name: string;
  };
  currentXP: number;
  stats: {
    watched: number;
    read: number;
    rated: number;
    lists: number;
  };
  favouriteAnime: {
    title: string;
    coverImage: string;
  }[];
  favouriteManga: {
    title: string;
    coverImage: string;
  }[];
  tasteProfile: {
    genre: string;
    count: number;
  }[];
  badges: {
    key: string;
    label: string;
    emoji: string;
    earned: boolean;
  }[];
}

const GENRE_FILL_COLORS = ["#534AB7", "#1d9e75", "#BA7517", "rgba(255,255,255,0.2)"];

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 7,
  color: "rgba(255,255,255,0.2)",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  marginBottom: 6,
};

function PosterRow({
  items,
}: {
  items: { title: string; coverImage: string }[];
}): React.JSX.Element {
  const slots = [...items.slice(0, 3)];
  while (slots.length < 3) slots.push({ title: "", coverImage: "" });

  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
      {slots.map((slot, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            aspectRatio: "2 / 3",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            background: "#1b1b1e",
            position: "relative",
          }}
        >
          {slot.coverImage ? (
            <ImageWithFallback
              src={slot.coverImage}
              alt=""
              fill
              sizes="120px"
              style={{ objectFit: "cover" }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PassportCard({
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

  const cornerBase: React.CSSProperties = {
    position: "absolute",
    width: 44,
    height: 44,
    pointerEvents: "none",
  };
  const cornerBorder = `1.5px solid ${accent}`;

  return (
    <div
      style={{
        width: 400,
        background: `linear-gradient(160deg, ${bgStart} 0%, #0f0f12 50%, #0a1218 100%)`,
        border: `1px solid ${hexToRgba(accent, 0.2)}`,
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: "var(--font-space-mono), 'Courier New', monospace",
        position: "relative",
      }}
    >
      {/* Corner accents */}
      <div style={{ ...cornerBase, top: 0, left: 0, borderTop: cornerBorder, borderLeft: cornerBorder, borderTopLeftRadius: 8 }} />
      <div style={{ ...cornerBase, top: 0, right: 0, borderTop: cornerBorder, borderRight: cornerBorder, borderTopRightRadius: 8 }} />
      <div style={{ ...cornerBase, bottom: 0, left: 0, borderBottom: cornerBorder, borderLeft: cornerBorder, borderBottomLeftRadius: 8 }} />
      <div style={{ ...cornerBase, bottom: 0, right: 0, borderBottom: cornerBorder, borderRight: cornerBorder, borderBottomRightRadius: 8 }} />

      {/* Subtle glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${hexToRgba(accent, 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "18px 18px 0", position: "relative" }}>
        {/* Brand row — same wordmark/font as the site nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span
            style={{
              fontFamily: "var(--font-anybody)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--fg)" }}>miru</span>
            <span style={{ color: "var(--primary)" }}>box</span>
          </span>
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            Taste Passport
          </span>
        </div>

        {/* Identity row */}
        <div style={{ display: "flex", gap: 13, marginBottom: 14, alignItems: "stretch" }}>
          <div
            style={{
              borderRadius: 2,
              boxShadow: `0 0 24px ${hexToRgba(accent, 0.12)}`,
              flexShrink: 0,
            }}
          >
            <UserAvatar
              userId={username}
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size={62}
              borderColor={hexToRgba(accent, 0.35)}
              borderWidth={2}
            />
          </div>
          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: 62,
            }}
          >
            <div>
              <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--fg-subtle)", margin: "0 0 2px" }}>
                @{username}
              </p>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: "var(--fg)", lineHeight: 1.1, margin: 0 }}>
                {displayName}
              </h2>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                fontFamily: "var(--font-space-mono)",
                fontSize: 8,
                fontWeight: 600,
                color: "var(--primary)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-card-high)",
                borderRadius: 2,
                padding: "2px 5px",
                letterSpacing: "0.04em",
              }}
            >
              {rank.name}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

        {/* Stats strip */}
        <div style={{ display: "flex", marginBottom: 14 }}>
          {[
            { label: "Watched", value: stats.watched },
            { label: "Read", value: stats.read },
            { label: "Rated", value: stats.rated },
            { label: "Lists", value: stats.lists },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                textAlign: "center",
                borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: "0 0 2px" }}>{s.value}</p>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 7,
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: 0,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

        {/* Fav anime */}
        <div>
          <p style={SECTION_LABEL_STYLE}>Top 3 Anime</p>
          <PosterRow items={favouriteAnime} />
        </div>

        {/* Fav manga */}
        <div style={{ marginTop: 8 }}>
          <p style={SECTION_LABEL_STYLE}>Top 3 Manga</p>
          <PosterRow items={favouriteManga} />
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "14px 0" }} />

        {/* Taste profile */}
        <div style={{ marginBottom: 14 }}>
          <p style={SECTION_LABEL_STYLE}>Taste Profile</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {tasteProfile.map((g, i) => (
              <div key={g.genre} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "rgba(255,255,255,0.4)", minWidth: 80 }}>
                  {g.genre}
                </span>
                <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1 }}>
                  <div
                    style={{
                      height: 2,
                      borderRadius: 1,
                      width: `${(g.count / maxTasteCount) * 100}%`,
                      background: i === 0 ? accent : (GENRE_FILL_COLORS[i - 1] ?? GENRE_FILL_COLORS[3]),
                    }}
                  />
                </div>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "rgba(255,255,255,0.15)" }}>
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

        {/* Badges */}
        <div style={{ marginBottom: 16 }}>
          <p style={SECTION_LABEL_STYLE}>Badges</p>
          <div style={{ display: "flex", gap: 8 }}>
            {shownBadges.map((badge) => (
              <div key={badge.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: badge.earned ? "rgba(232,23,63,0.1)" : "var(--bg-elevated)",
                    border: badge.earned ? "1.5px solid rgba(232,23,63,0.4)" : "1px solid var(--bg-card-high)",
                    fontSize: badge.earned ? 16 : 12,
                    color: badge.earned ? undefined : "var(--fg-faint)",
                  }}
                >
                  {badge.earned ? badge.emoji : "🔒"}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 7,
                    textAlign: "center",
                    maxWidth: 52,
                    color: badge.earned ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "9px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 8, color: "rgba(255,255,255,0.18)" }}>
          <span style={{ color: hexToRgba(accent, 0.6) }}>mirubox</span>.vercel.app/u/{username}
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 8,
            color: "rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 2,
            padding: "2px 7px",
          }}
        >
          {currentXP} XP
        </span>
      </div>
    </div>
  );
}
