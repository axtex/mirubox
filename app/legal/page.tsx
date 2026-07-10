import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal — mirubox",
};

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  color: "#5a5a65",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 10,
};

const BODY_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "#9e9ea8",
  lineHeight: 1.7,
};

function Divider() {
  return <div style={{ height: 1, background: "#1f1f22", margin: "28px 0" }} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p style={HEADING_STYLE}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div style={{ background: "#0f0f12", minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 0" }}>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 13, fontWeight: 600, color: "#e4e1e6", marginBottom: 4 }}>
          LEGAL
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#3a3a45", marginBottom: 32 }}>
          Last updated: July 2026
        </p>

        <Section title="TERMS OF USE">
          <p style={BODY_STYLE}>
            mirubox is a personal project provided as-is. By using the platform you agree to use
            it fairly and not attempt to abuse, scrape, or disrupt the service.
          </p>
          <p style={BODY_STYLE}>
            You are responsible for the content you post — reviews, list names, and profile
            information. Don&apos;t post anything illegal, harmful, or that you don&apos;t have
            the right to share.
          </p>
          <p style={BODY_STYLE}>
            We reserve the right to remove content or accounts that violate these terms.
          </p>
        </Section>

        <Divider />

        <Section title="PRIVACY">
          <p style={BODY_STYLE}>
            mirubox stores your email address and the content you create — tracker entries,
            ratings, reviews, and lists. We do not sell your data or share it with advertisers.
          </p>
          <p style={BODY_STYLE}>
            Anime and manga data is sourced from AniList via their public GraphQL API. We cache
            this data to improve performance.
          </p>
          <p style={BODY_STYLE}>
            Authentication is handled via OAuth (Google) or email magic link through NextAuth. We
            do not store passwords.
          </p>
        </Section>

        <Divider />

        <Section title="CONTENT">
          <p style={BODY_STYLE}>
            Anime and manga metadata, images, and scores are provided by AniList (anilist.co)
            under their terms of service. Character and voice actor data is also sourced from
            AniList.
          </p>
          <p style={BODY_STYLE}>
            mirubox is not affiliated with or endorsed by AniList, any studio, publisher, or
            rights holder.
          </p>
        </Section>

        <Divider />

        <Section title="DISCLAIMER">
          <p style={BODY_STYLE}>
            mirubox is an independent project in active development. Features may change, data
            may be lost during development phases, and the service may be unavailable at times.
            Use at your own risk.
          </p>
        </Section>

        <Divider />

        <Section title="CONTACT">
          <p style={BODY_STYLE}>
            For legal enquiries:{" "}
            <Link href="/contact" style={{ color: "#e8173f", textDecoration: "none" }}>
              see /contact
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}
