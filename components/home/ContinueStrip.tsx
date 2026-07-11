"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import type { ContinueItem } from "@/components/home/ContinueCard";
import { ContinueCardsRow } from "@/components/home/ContinueCardsRow";
import { SeasonChallengeModal } from "@/components/home/SeasonChallengeModal";
import { formatSeasonLabel } from "@/lib/season";

export interface ContinueStripSeasonChallenge {
  emoji: string;
  label: string;
  season: string;
  year: number;
  target: number;
  count: number;
  isEarned: boolean;
  badgeLabel: string;
  xpReward: number;
  completedTitles: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
  }[];
  suggestions: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    averageScore: number | null;
  }[];
}

interface ContinueStripProps {
  items: ContinueItem[];
  seasonChallenge?: ContinueStripSeasonChallenge | null;
}

export function ContinueStrip({
  items,
  seasonChallenge = null,
}: ContinueStripProps): React.JSX.Element | null {
  const [modalOpen, setModalOpen] = useState(false);

  if (items.length === 0 && !seasonChallenge) {
    return null;
  }

  const progressPct = seasonChallenge
    ? Math.min(
        100,
        Math.round((seasonChallenge.count / seasonChallenge.target) * 100)
      )
    : 0;

  const challengeRowLabel = seasonChallenge
    ? `${seasonChallenge.emoji} ${formatSeasonLabel(seasonChallenge.season)} ${seasonChallenge.year} Challenge`
    : "";

  return (
    <section className="min-w-0">
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">CONTINUE</h2>
          <Link
            href="/tracker?status=in-progress"
            className="text-label inline-flex items-center gap-1 link-accent"
            style={{ color: "var(--primary)" }}
          >
            TRACKER
            <ChevronRight size={12} strokeWidth={2} color="var(--primary)" aria-hidden />
          </Link>
        </div>
        <div className="section-underline" />
      </div>

      {items.length > 0 && <ContinueCardsRow items={items} />}

      {seasonChallenge && (
        <>
          <div
            style={{
              borderTop: "1px solid #1a1a1d",
              marginTop: items.length > 0 ? 6 : 0,
            }}
          />
          {seasonChallenge.isEarned ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                paddingTop: 8,
              }}
            >
              <Check size={12} strokeWidth={2.5} color="#1d9e75" aria-hidden />
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#5a5a65",
                }}
              >
                {seasonChallenge.emoji} {seasonChallenge.label} Challenge
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 8,
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#9e9ea8",
                  flexShrink: 0,
                }}
              >
                {challengeRowLabel}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: "#1f1f22",
                  borderRadius: 2,
                  overflow: "hidden",
                  maxWidth: 80,
                }}
              >
                <div
                  style={{
                    height: 3,
                    width: `${progressPct}%`,
                    background: "#e8173f",
                    borderRadius: 2,
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#5a5a65",
                  flexShrink: 0,
                }}
              >
                {seasonChallenge.count}/{seasonChallenge.target}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#3a3a45",
                  marginLeft: 4,
                  flexShrink: 0,
                }}
                aria-hidden
              >
                →
              </span>
            </button>
          )}
        </>
      )}

      {seasonChallenge && (
        <SeasonChallengeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          emoji={seasonChallenge.emoji}
          label={seasonChallenge.label}
          season={seasonChallenge.season}
          year={seasonChallenge.year}
          target={seasonChallenge.target}
          count={seasonChallenge.count}
          isEarned={seasonChallenge.isEarned}
          badgeLabel={seasonChallenge.badgeLabel}
          xpReward={seasonChallenge.xpReward}
          completedTitles={seasonChallenge.completedTitles}
          suggestions={seasonChallenge.suggestions}
        />
      )}
    </section>
  );
}
