import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — mirubox",
};

function Divider() {
  return <div style={{ height: 1, background: "#1f1f22", margin: "28px 0" }} />;
}

const BODY_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "#9e9ea8",
  lineHeight: 1.7,
};

export default function AboutPage() {
  return (
    <div style={{ background: "#0f0f12", minHeight: "100vh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
        <div
          style={{
            fontFamily: "var(--font-anybody)",
            fontSize: 28,
            fontWeight: 800,
            color: "#e4e1e6",
            marginBottom: 24,
          }}
        >
          <span>miru</span>
          <span style={{ color: "#e8173f" }}>box</span>
        </div>

        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 15,
            color: "#e4e1e6",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          Track what you watch.
          <br />
          Discover what to watch next.
        </p>

        <p style={{ ...BODY_STYLE, marginBottom: 24 }}>
          mirubox is a tracker built around taste — not just lists. Everything you add, rate, and
          review shapes your recommendations and defines your profile.
        </p>

        <Divider />

        <p style={BODY_STYLE}>
          We believe your anime taste is worth taking seriously. Not as a stat to optimise, but as
          a genuine reflection of what moves you — what makes you laugh, think, or stay up until
          3am to finish one more episode.
        </p>

        <Divider />

        <p style={BODY_STYLE}>
          mirubox is independent and in active development. Features ship regularly. The tracker,
          discover engine, and profile are live. Community features coming.
        </p>

        <Divider />

        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "#5a5a65",
            fontStyle: "italic",
          }}
        >
          Built by a team of one who got bored of tracking titles in her Notes app.
        </p>
      </div>
    </div>
  );
}
