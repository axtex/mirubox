"use client";

import { useSession } from "next-auth/react";
import { AddToListButton } from "@/components/lists/AddToListModal";
import type { StreamingLink } from "@/lib/streaming-links";

export interface SidebarDetailsRow {
  label: string;
  value: string | null | undefined;
}

export interface DetailSidebarMetaProps {
  details: SidebarDetailsRow[];
  watchSection?: {
    title: string;
    links: StreamingLink[];
    isFallback: boolean;
    fallbackNote: string;
  };
  nextEpisodeLabel?: string | null;
  lists?: {
    mediaId: number;
    mediaType: "ANIME" | "MANGA";
  };
  /**
   * Section order. Desktop sidebar default: details → next → watch.
   * Mobile page: details → lists → watch → next.
   */
  order?: Array<"details" | "lists" | "watch" | "next">;
}

const BLOCK_STYLE: React.CSSProperties = {
  background: "#1b1b1e",
  border: "1px solid #1f1f22",
  borderRadius: 2,
  padding: "10px 12px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "#5a5a65",
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "#9e9ea8",
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#5a5a65",
  marginBottom: 6,
};

function parseAiringLabel(label: string): { episode: string; timing: string } | null {
  const match = /^EP (\d+) (.+)$/.exec(label);
  if (!match) return null;
  return { episode: match[1], timing: match[2] };
}

export function DetailSidebarMeta({
  details,
  watchSection,
  nextEpisodeLabel,
  lists,
  order = ["details", "next", "watch"],
}: DetailSidebarMetaProps): React.JSX.Element {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const rows = details.filter((row) => row.value != null && row.value !== "");

  const sections: Record<"details" | "lists" | "watch" | "next", React.ReactNode> = {
    details:
      rows.length > 0 ? (
        <div key="details">
          <p style={SECTION_TITLE}>DETAILS</p>
          <div style={BLOCK_STYLE}>
            {rows.map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "4px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #131316" : "none",
                }}
              >
                <span style={LABEL_STYLE}>{row.label}</span>
                <span
                  style={{
                    ...VALUE_STYLE,
                    textAlign: "right",
                    maxWidth: "60%",
                    wordBreak: "break-word",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null,

    next: nextEpisodeLabel ? (
      <div key="next" className="detail-sidebar-section">
        <p className="detail-sidebar-section-title">NEXT EPISODE</p>
        <div className="detail-sidebar-block detail-sidebar-block--airing">
          <div className="detail-sidebar-airing-copy">
            {(() => {
              const airing = parseAiringLabel(nextEpisodeLabel);
              return airing ? (
                <>
                  <span className="detail-sidebar-airing-ep">EP {airing.episode}</span>
                  <span className="detail-sidebar-airing-timing">{airing.timing}</span>
                </>
              ) : (
                <span className="detail-sidebar-airing-timing">{nextEpisodeLabel}</span>
              );
            })()}
          </div>
        </div>
      </div>
    ) : null,

    watch:
      watchSection && (watchSection.links.length > 0 || watchSection.isFallback) ? (
        <div key="watch" className="detail-sidebar-section">
          <p className="detail-sidebar-section-title">{watchSection.title}</p>
          {watchSection.links.length > 0 ? (
            <div className="detail-watch-links">
              {watchSection.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-watch-link"
                  style={link.color ? { borderLeft: `2px solid ${link.color}` } : undefined}
                >
                  <span>{link.site}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="detail-watch-fallback-note">{watchSection.fallbackNote}</p>
          )}
        </div>
      ) : null,

    lists: lists ? (
      <div key="lists">
        <p style={SECTION_TITLE}>LISTS</p>
        <div style={BLOCK_STYLE}>
          <AddToListButton
            mediaId={lists.mediaId}
            mediaType={lists.mediaType}
            isLoggedIn={isLoggedIn}
            sidebar
          />
        </div>
      </div>
    ) : null,
  };

  return (
    <div className="flex flex-col gap-4">
      {order.map((key) => sections[key])}
    </div>
  );
}
