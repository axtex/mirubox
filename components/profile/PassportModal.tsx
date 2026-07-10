"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PassportCard } from "@/components/profile/PassportCard";

export interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
  avatarUrl: string;
  rank: { name: string; emoji: string };
  currentXP: number;
  nextRankName: string;
  nextRankXP: number;
  rankMinXP: number;
  stats: {
    watched: number;
    read: number;
    rated: number;
    lists: number;
  };
  favouriteAnime: { title: string; coverImage: string }[];
  favouriteManga: { title: string; coverImage: string }[];
  tasteProfile: { genre: string; count: number }[];
  badges: {
    key: string;
    label: string;
    emoji: string;
    earned: boolean;
  }[];
}

function ActionButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered && !disabled ? "#3a3a3d" : "#2a2a2d"}`,
        background: "transparent",
        color: hovered && !disabled ? "#e4e1e6" : "#9e9ea8",
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        borderRadius: 2,
        padding: "5px 12px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function PassportModal({
  isOpen,
  onClose,
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
}: PassportModalProps): React.JSX.Element | null {
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });
  const bodyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updateScale(): void {
      const body = bodyRef.current;
      const card = cardRef.current;
      if (!body || !card) return;
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;
      if (cardW === 0 || cardH === 0) return;
      // Cap below 1 and leave headroom so the card never fills the body edge-to-edge
      const next = Math.min(0.82, (body.clientWidth * 0.92) / cardW, (body.clientHeight * 0.88) / cardH);
      setFit({
        scale: Number.isFinite(next) && next > 0 ? next : 0.82,
        width: cardW,
        height: cardH,
      });
    }

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleDownload(): Promise<void> {
    setDownloading(true);
    try {
      const res = await fetch(`/api/passport?username=${username}`);
      if (!res.ok) throw new Error("Failed to generate");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mirubox-${username}-passport.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadFailed(true);
      setTimeout(() => setDownloadFailed(false), 2000);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`https://mirubox.vercel.app/u/${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked without a user gesture — silently fail
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#131316",
          borderBottom: "1px solid #1f1f22",
          padding: "10px 16px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="review-modal-close"
          style={{ justifySelf: "start" }}
        >
          ×
        </button>

        <div style={{ display: "flex", gap: 6, justifySelf: "center" }}>
          <ActionButton onClick={() => void handleDownload()} disabled={downloading}>
            {downloadFailed ? "FAILED" : downloading ? "DOWNLOADING..." : "DOWNLOAD"}
          </ActionButton>
          <ActionButton onClick={() => void handleCopyLink()}>
            {copied ? "COPIED ✓" : "COPY LINK"}
          </ActionButton>
        </div>
      </div>

      {/* Body — scale card to fit viewport; click outside card closes */}
      <div
        ref={bodyRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 20px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: fit.width ? fit.width * fit.scale : undefined,
            height: fit.height ? fit.height * fit.scale : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            ref={cardRef}
            style={{
              transform: `scale(${fit.scale})`,
              transformOrigin: "center center",
              flexShrink: 0,
            }}
          >
            <PassportCard
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
              rank={{ name: rank.name }}
              currentXP={currentXP}
              stats={stats}
              favouriteAnime={favouriteAnime}
              favouriteManga={favouriteManga}
              tasteProfile={tasteProfile}
              badges={badges}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
