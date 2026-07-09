import type { Metadata } from "next";
import { RANKS } from "@/lib/xp";

export const metadata: Metadata = {
  title: "How it works — mirubox",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  color: "#5a5a65",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 14,
};

const PROSE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "#9e9ea8",
  lineHeight: 1.7,
};

const GROUP_HEADER_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  color: "#3a3a45",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  padding: "5px 10px",
  background: "#1b1b1e",
  borderRadius: 2,
  display: "inline-block",
};

function Divider() {
  return <div style={{ height: 1, background: "#1f1f22", margin: "28px 0" }} />;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p style={LABEL_STYLE}>{children}</p>;
}

// ─── Section 1 — Ranks ──────────────────────────────────────────────────────

const RANK_META: Record<string, { emoji: string; color: string }> = {
  WATCHER: { emoji: "👁", color: "#9e9ea8" },
  TRACKER: { emoji: "📌", color: "#1d9e75" },
  ARCHIVIST: { emoji: "📂", color: "#8b83e0" },
  CURATOR: { emoji: "🎯", color: "#BA7517" },
  SCHOLAR: { emoji: "⚡", color: "#e8173f" },
  SAGE: { emoji: "🔮", color: "#64b4e6" },
  LEGEND: { emoji: "👑", color: "#e8c864" },
};

// ─── Section 2 — How you earn XP ───────────────────────────────────────────

interface XPRow {
  name: string;
  description: string;
}

const XP_GROUPS: Array<{ title: string; note?: string; rows: XPRow[] }> = [
  {
    title: "TRACKING",
    rows: [
      { name: "Add to archive", description: "Adding any title to your archive for the first time." },
      { name: "Start watching", description: "Moving a title from Planned to In Progress." },
      {
        name: "Complete a series",
        description:
          "Finishing a series you were actively watching. Adding directly to Completed earns less — the journey matters.",
      },
      { name: "Complete a film or OVA", description: "Finishing a shorter format title from In Progress." },
    ],
  },
  {
    title: "ENGAGEMENT",
    rows: [
      { name: "Rate a title", description: "Giving a title a score out of 10." },
      { name: "Write a review", description: "Writing a review for a title you've watched or read." },
      { name: "Add to a list", description: "Adding a title to one of your curated lists." },
      { name: "Create a list", description: "Creating a new list with at least one title." },
    ],
  },
  {
    title: "DAILY",
    rows: [
      { name: "Daily login", description: "Logging in each day." },
      { name: "Login streak bonus", description: "Logging in 7 days in a row earns a small bonus." },
    ],
  },
  {
    title: "SOCIAL",
    note: "(Coming with community feature)",
    rows: [
      { name: "Add a friend", description: "Connecting with another mirubox user." },
      { name: "Invite a friend", description: "Inviting someone who signs up via your link." },
    ],
  },
  {
    title: "MILESTONES",
    rows: [
      { name: "First title", description: "A welcome bonus for adding your first title." },
      {
        name: "Season challenge",
        description: "Watching or completing 3 titles from a current anime season earns a seasonal badge and XP bonus.",
      },
      { name: "Badge unlocked", description: "Each badge earned comes with an XP reward." },
    ],
  },
];

// ─── Section 3 — Badges ─────────────────────────────────────────────────────

interface BadgeRow {
  icon: string;
  name: string;
  requirement: string;
}

const BADGE_CATEGORIES: Array<{ title: string; note?: string; badges: BadgeRow[] }> = [
  {
    title: "COMPLETION",
    badges: [
      { icon: "✓", name: "First Finish", requirement: "Complete your first series" },
      { icon: "📺", name: "Series Binger", requirement: "Complete 10 series" },
      { icon: "🗂", name: "Completionist", requirement: "Complete 50 series" },
      { icon: "🏛", name: "Centenarian", requirement: "Complete 100 series" },
      { icon: "🎬", name: "Cinephile", requirement: "Complete 10 anime films" },
      { icon: "🌀", name: "Completionist+", requirement: "Complete an entire franchise" },
    ],
  },
  {
    title: "DEMOGRAPHIC — ENTHUSIAST",
    badges: [
      { icon: "⚔️", name: "Shonen Enthusiast", requirement: "Complete 10 Shonen titles" },
      { icon: "🌸", name: "Shojo Enthusiast", requirement: "Complete 10 Shojo titles" },
      { icon: "🗡", name: "Seinen Enthusiast", requirement: "Complete 10 Seinen titles" },
      { icon: "💐", name: "Josei Enthusiast", requirement: "Complete 10 Josei titles" },
    ],
  },
  {
    title: "DEMOGRAPHIC — VETERAN",
    badges: [
      { icon: "🔥", name: "Shonen Veteran", requirement: "Complete 30 Shonen titles" },
      { icon: "🌺", name: "Shojo Veteran", requirement: "Complete 30 Shojo titles" },
      { icon: "⚔️", name: "Seinen Veteran", requirement: "Complete 30 Seinen titles" },
      { icon: "💮", name: "Josei Veteran", requirement: "Complete 30 Josei titles" },
    ],
  },
  {
    title: "GENRE MASTERY",
    badges: [
      { icon: "🧠", name: "Mind Bent", requirement: "Complete 10 Psychological titles" },
      { icon: "🌙", name: "Slice of Lifer", requirement: "Complete 10 Slice of Life titles" },
      { icon: "💘", name: "The Romantic", requirement: "Complete 10 Romance titles" },
      { icon: "👻", name: "Horror Head", requirement: "Complete 10 Horror titles" },
      { icon: "🚀", name: "Sci-Fi Fan", requirement: "Complete 10 Sci-Fi titles" },
      { icon: "🏰", name: "Fantasy Dweller", requirement: "Complete 10 Fantasy titles" },
    ],
  },
  {
    title: "MANGA",
    badges: [
      { icon: "📖", name: "Reader", requirement: "Complete 5 manga series" },
      { icon: "📚", name: "Bookworm", requirement: "Complete 20 manga series" },
      { icon: "🗃", name: "Stacker", requirement: "Complete 50 manga series" },
      { icon: "✒️", name: "One and Done", requirement: "Complete 10 one-shots" },
      { icon: "📝", name: "Read Before Watch", requirement: "Complete a manga and its anime adaptation" },
      { icon: "🖊", name: "Origin Seeker", requirement: "Complete 5 manga with anime adaptations" },
      { icon: "🌿", name: "Up to Date", requirement: "Complete a manga that is currently publishing" },
    ],
  },
  {
    title: "CRITIC",
    badges: [
      { icon: "✍️", name: "First Take", requirement: "Write your first review" },
      { icon: "📝", name: "Critic", requirement: "Write 10 reviews" },
      { icon: "📰", name: "Staff Writer", requirement: "Write 25 reviews" },
      { icon: "⭐", name: "Big Rater", requirement: "Rate 50 titles" },
      { icon: "🎖", name: "Discerning", requirement: "Rate 100 titles" },
    ],
  },
  {
    title: "STREAK",
    note:
      "Streak badges require consecutive days with real activity — adding titles, rating, reviewing, or updating progress. Simply logging in does not count.",
    badges: [
      { icon: "🔥", name: "On a Roll", requirement: "7 consecutive days with activity" },
      { icon: "🌋", name: "Committed", requirement: "30 consecutive days with activity" },
      { icon: "💀", name: "Devoted", requirement: "100 consecutive days with activity" },
    ],
  },
  {
    title: "SEASONAL",
    note:
      "Earn a seasonal badge by watching or completing 3 titles from that season. Seasonal badges are named by year — e.g. Summer 2026 Watcher. Earn 4 in a row for Seasoned Watcher.",
    badges: [
      { icon: "🌱", name: "Spring Watcher", requirement: "3 Spring season titles watched or completed" },
      { icon: "☀️", name: "Summer Watcher", requirement: "3 Summer season titles watched or completed" },
      { icon: "🍂", name: "Fall Watcher", requirement: "3 Fall season titles watched or completed" },
      { icon: "❄️", name: "Winter Watcher", requirement: "3 Winter season titles watched or completed" },
      { icon: "🗓", name: "Seasoned Watcher", requirement: "4 consecutive seasonal badges" },
    ],
  },
  {
    title: "EXPLORER",
    badges: [
      { icon: "🗺", name: "Genre Explorer", requirement: "Complete titles across 8 different genres" },
      { icon: "📅", name: "Historian", requirement: "Complete a title released before 2000" },
      { icon: "🔭", name: "Hidden Gem", requirement: "Complete 10 titles with a small following" },
      { icon: "🌐", name: "All-Rounder", requirement: "Complete anime, manga, a film, and an OVA" },
    ],
  },
  {
    title: "SOCIAL",
    note: "Coming with the community feature.",
    badges: [
      { icon: "📨", name: "Recruiter", requirement: "Invite a friend who signs up" },
      { icon: "👥", name: "Ambassador", requirement: "Invite 5 friends who sign up" },
      { icon: "📋", name: "List Maker", requirement: "Create 3 public lists" },
      { icon: "❤️", name: "Well Liked", requirement: "Receive 10 likes on a single list" },
    ],
  },
  {
    title: "PRESTIGE",
    badges: [
      { icon: "🏅", name: "Top 100", requirement: "Complete 50 titles from AniList's all-time top 100" },
      { icon: "🎌", name: "Purist", requirement: "Complete 20 titles with a 9.0+ score on AniList" },
      { icon: "👁‍🗨", name: "Contrarian", requirement: "Rate 10 titles very differently from the AniList average" },
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: "#0f0f12", minHeight: "100vh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ ...PROSE_STYLE, marginBottom: 32 }}>
          mirubox is an anime and manga tracking platform. Add titles, track progress, rate and
          review what you&apos;ve watched, and build lists to share with others.
        </p>

        <Divider />

        {/* ── Section 1 — Ranks ─────────────────────────────────────────── */}
        <SectionHeader>RANKS</SectionHeader>
        <p style={{ ...PROSE_STYLE, marginBottom: 14 }}>
          As you use mirubox you earn XP. Your rank increases as your XP grows, unlocking new
          features along the way.
        </p>

        <div style={{ border: "1px solid #1f1f22", borderRadius: 2, marginBottom: 28 }}>
          {RANKS.map((r, i) => {
            const meta = RANK_META[r.name];
            return (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 12px",
                  borderBottom: i === RANKS.length - 1 ? "none" : "1px solid #1a1a1d",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{meta.emoji}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#e4e1e6",
                    }}
                  >
                    {r.name}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    color: meta.color,
                  }}
                >
                  {r.min.toLocaleString()} XP
                </span>
              </div>
            );
          })}
        </div>

        <Divider />

        {/* ── Section 2 — How you earn XP ───────────────────────────────── */}
        <SectionHeader>HOW YOU EARN XP</SectionHeader>
        <p style={{ ...PROSE_STYLE, marginBottom: 14 }}>
          XP is earned by engaging with mirubox — tracking, rating, reviewing, and discovering new
          titles.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 18 }}>
          {XP_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-2" style={{ marginBottom: 0 }}>
                <span style={GROUP_HEADER_STYLE}>{group.title}</span>
                {group.note && (
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#3a3a45" }}>
                    {group.note}
                  </span>
                )}
              </div>
              <div style={{ border: "1px solid #1f1f22" }}>
                {group.rows.map((row, i) => (
                  <div
                    key={row.name}
                    style={{
                      padding: "9px 12px",
                      borderBottom: i === group.rows.length - 1 ? "none" : "1px solid #1a1a1d",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#e4e1e6",
                        marginBottom: 2,
                      }}
                    >
                      {row.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#9e9ea8", lineHeight: 1.5 }}>
                      {row.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <span style={{ ...GROUP_HEADER_STYLE, marginBottom: 0 }}>FAIR PLAY</span>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "#5a5a65",
              padding: "10px 12px",
              background: "#1b1b1e",
              border: "1px solid #1f1f22",
              borderRadius: 2,
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            XP from adding titles is capped at 5 titles per day — bulk-adding a backlog won&apos;t
            fast-track your rank. Completion XP is only awarded when you finish something you were
            actively watching. Rating and review XP is awarded once per title.
          </p>
        </div>

        <Divider />

        {/* ── Section 3 — Badges ────────────────────────────────────────── */}
        <SectionHeader>BADGES</SectionHeader>
        <p style={{ ...PROSE_STYLE, marginBottom: 20 }}>
          Badges are earned for specific achievements — separate from your rank. A new user can
          earn rare badges that veteran users haven&apos;t. Badges are permanent once earned.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {BADGE_CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#3a3a45",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "5px 10px",
                  background: "#1b1b1e",
                  border: "1px solid #1f1f22",
                  borderRadius: "2px 2px 0 0",
                  margin: 0,
                }}
              >
                {cat.title}
              </p>
              {cat.note && (
                <p
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: "#3a3a45",
                    padding: "6px 10px",
                    background: "#131316",
                    borderBottom: "1px solid #1a1a1d",
                    borderLeft: "1px solid #1f1f22",
                    borderRight: "1px solid #1f1f22",
                    lineHeight: 1.5,
                  }}
                >
                  {cat.note}
                </p>
              )}
              <div
                style={{
                  border: "1px solid #1f1f22",
                  borderTop: "none",
                  borderRadius: "0 0 2px 2px",
                  overflow: "hidden",
                }}
              >
                {cat.badges.map((badge, i) => (
                  <div
                    key={badge.name}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "8px 12px",
                      borderBottom: i === cat.badges.length - 1 ? "none" : "1px solid #1a1a1d",
                    }}
                  >
                    <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                      {badge.icon}
                    </span>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#e4e1e6",
                          marginBottom: 1,
                        }}
                      >
                        {badge.name}
                      </p>
                      <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "#5a5a65" }}>
                        {badge.requirement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
