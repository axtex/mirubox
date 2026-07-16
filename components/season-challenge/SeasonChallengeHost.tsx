"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SeasonChallengeModal } from "@/components/home/SeasonChallengeModal";
import { useTracker } from "@/lib/tracker-context";
import {
  fetchContinueStripSeasonChallenge,
  SEASON_CHALLENGE_OPEN_EVENT,
  SEASON_CHALLENGE_SYNC_EVENT,
  type ContinueStripSeasonChallenge,
  type SeasonChallengeSyncDetail,
} from "@/lib/season-challenge-client";

export function SeasonChallengeHost(): React.JSX.Element | null {
  const { isLoggedIn } = useTracker();
  const pathname = usePathname();
  const [data, setData] = useState<ContinueStripSeasonChallenge | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async (justEarned?: boolean) => {
    try {
      const next = await fetchContinueStripSeasonChallenge();
      if (next) {
        setData(next);
      }
      if (justEarned && next?.isEarned) {
        setOpen(true);
      }
    } catch {
      // ignore — keep last known state
    }
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<SeasonChallengeSyncDetail>).detail;
      if (detail?.challenge) {
        setData(detail.challenge);
      }
      // Always refresh so earned popups get snapshotted completed titles.
      void refresh(detail?.justEarned);
    };

    const onOpen = () => {
      void refresh().then(() => setOpen(true));
    };

    window.addEventListener(SEASON_CHALLENGE_SYNC_EVENT, onSync);
    window.addEventListener(SEASON_CHALLENGE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(SEASON_CHALLENGE_SYNC_EVENT, onSync);
      window.removeEventListener(SEASON_CHALLENGE_OPEN_EVENT, onOpen);
    };
  }, [isLoggedIn, refresh]);

  if (!data) {
    return null;
  }

  return (
    <SeasonChallengeModal
      isOpen={open}
      onClose={() => setOpen(false)}
      emoji={data.emoji}
      label={data.label}
      season={data.season}
      year={data.year}
      target={data.target}
      count={data.count}
      isEarned={data.isEarned}
      badgeLabel={data.badgeLabel}
      xpReward={data.xpReward}
      completedTitles={data.completedTitles}
      suggestions={data.suggestions}
    />
  );
}
