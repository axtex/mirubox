"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import type { ContinueItem } from "@/components/home/ContinueCard";
import { ContinueCardsRow } from "@/components/home/ContinueCardsRow";
import { formatSeasonLabel } from "@/lib/season";
import {
  fetchContinueStripSeasonChallenge,
  openSeasonChallengeModal,
  SEASON_CHALLENGE_SYNC_EVENT,
  type ContinueStripSeasonChallenge,
} from "@/lib/season-challenge-client";

export type { ContinueStripSeasonChallenge };

interface ContinueStripProps {
  items: ContinueItem[];
  seasonChallenge?: ContinueStripSeasonChallenge | null;
}

export function ContinueStrip({
  items,
  seasonChallenge: initialSeasonChallenge = null,
}: ContinueStripProps): React.JSX.Element | null {
  const [seasonChallenge, setSeasonChallenge] =
    useState<ContinueStripSeasonChallenge | null>(initialSeasonChallenge);

  useEffect(() => {
    setSeasonChallenge(initialSeasonChallenge);
  }, [initialSeasonChallenge]);

  const refreshSeasonChallenge = useCallback(async () => {
    try {
      const data = await fetchContinueStripSeasonChallenge();
      setSeasonChallenge(data);
    } catch {
      // ignore — keep last known state
    }
  }, []);

  useEffect(() => {
    window.addEventListener(SEASON_CHALLENGE_SYNC_EVENT, refreshSeasonChallenge);
    return () => {
      window.removeEventListener(SEASON_CHALLENGE_SYNC_EVENT, refreshSeasonChallenge);
    };
  }, [refreshSeasonChallenge]);

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
            <button
              type="button"
              onClick={openSeasonChallengeModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                paddingTop: 8,
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
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
            </button>
          ) : (
            <button
              type="button"
              onClick={openSeasonChallengeModal}
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
                  height: 2,
                  background: "#1f1f22",
                  borderRadius: 1,
                  overflow: "hidden",
                  maxWidth: 56,
                }}
              >
                <div
                  style={{
                    height: 2,
                    width: `${progressPct}%`,
                    background: "#e8173f",
                    borderRadius: 1,
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
              <ChevronRight
                size={12}
                strokeWidth={2}
                color="#3a3a45"
                aria-hidden
                style={{ flexShrink: 0 }}
              />
            </button>
          )}
        </>
      )}
    </section>
  );
}
