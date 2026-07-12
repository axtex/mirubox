"use client";

import { BadgeScrollRow } from "@/components/profile/BadgeScrollRow";
import { GenreBars } from "@/components/profile/GenreBars";
import type { BadgeDisplay, GenreCount, StreakDay } from "@/lib/profile-types";
import type { RankProgress } from "@/lib/xp";

interface StatsTabProps {
  totalXP: number;
  rank: RankProgress;
  streak: { current: number; longest: number; days: StreakDay[] };
  badges: BadgeDisplay[];
  statsGenres: GenreCount[];
  ratingDistribution: { rating: number; count: number }[];
}

function StatCard({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-card)",
        borderRadius: 2,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      {label ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "var(--fg-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 10px",
          }}
        >
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function dayStyle(day: StreakDay): React.CSSProperties {
  if (day.isFuture) {
    return {
      background: "var(--bg-elevated)",
      color: "var(--fg-faint)",
      border: "none",
    };
  }
  if (day.hasActivity) {
    return {
      background: "rgba(232,23,63,0.1)",
      color: "var(--primary)",
      border: "1px solid rgba(232,23,63,0.35)",
    };
  }
  if (day.isToday) {
    return {
      background: "rgba(232,23,63,0.15)",
      color: "var(--primary)",
      border: "1px solid rgba(232,23,63,0.4)",
    };
  }
  return {
    background: "var(--bg-elevated)",
    color: "var(--fg-faint)",
    border: "none",
  };
}

export function StatsTab({
  totalXP,
  rank,
  streak,
  badges,
  statsGenres,
  ratingDistribution,
}: StatsTabProps): React.JSX.Element {
  const maxRating = Math.max(...ratingDistribution.map((r) => r.count), 1);

  return (
    <div style={{ padding: "16px 0" }}>
      <StatCard label="WEEKLY STREAK">
        <div style={{ display: "flex", gap: 4 }}>
          {streak.days.map((day, i) => (
            <div
              key={`${day.label}-${i}`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 3,
                fontFamily: "var(--font-space-mono)",
                fontSize: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...dayStyle(day),
              }}
            >
              {day.label}
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            margin: "6px 0 0",
          }}
        >
          <span style={{ color: "var(--fg)", fontWeight: 600 }}>{streak.current}</span>
          {" day streak · Best: "}
          <span style={{ color: "var(--fg)", fontWeight: 600 }}>{streak.longest}</span>
          {" days"}
        </p>
      </StatCard>

      <StatCard label="XP PROGRESSION">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "rgba(232,23,63,0.1)",
              border: "1px solid rgba(232,23,63,0.35)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {rank.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              {rank.name}
            </p>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-subtle)",
                margin: "0 0 6px",
              }}
            >
              {totalXP}
              {rank.nextMinXP != null ? ` / ${rank.nextMinXP}` : ""} XP
            </p>
            <div
              style={{
                height: 4,
                background: "var(--bg-card)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 4,
                  width: `${rank.progressPct}%`,
                  background: "linear-gradient(to right, var(--primary), #ff4455)",
                  borderRadius: 2,
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-faint)",
                margin: "3px 0 0",
              }}
            >
              {rank.isMax
                ? "MAX RANK"
                : `Next rank: ${rank.nextName}`}
            </p>
          </div>
        </div>
      </StatCard>

      <BadgeScrollRow badges={badges} />

      <StatCard label="GENRE DISTRIBUTION">
        <GenreBars
          genres={statsGenres}
          emptyMessage="No genre data yet."
        />
      </StatCard>

      <StatCard label="RATING DISTRIBUTION">
        {ratingDistribution.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-faint)",
              margin: 0,
            }}
          >
            No ratings yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ratingDistribution.map((row) => (
              <div
                key={row.rating}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    color: "var(--fg-subtle)",
                    width: 18,
                    textAlign: "right",
                  }}
                >
                  {row.rating}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 7,
                    background: "var(--bg-card)",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: 7,
                      borderRadius: 1,
                      width: `${Math.round((row.count / maxRating) * 100)}%`,
                      background: "var(--primary)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    color: "var(--fg-faint)",
                    width: 16,
                  }}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </StatCard>
    </div>
  );
}
