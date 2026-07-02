import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface SidebarDetailsRow {
  label: string;
  value: string | null | undefined;
}

interface SidebarExternalLink {
  id: number;
  url: string;
  site: string;
}

interface DetailSidebarProps {
  details: SidebarDetailsRow[];
  genres: string[];
  genreSearchPrefix: string;
  watchSection?: {
    title: string;
    links: SidebarExternalLink[];
    emptyMessage: string;
  };
  nextEpisodeLabel?: string | null;
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
  textTransform: "uppercase" as const,
  color: "#5a5a65",
  marginBottom: 6,
};

function parseAiringLabel(label: string): { episode: string; timing: string } | null {
  const match = /^EP (\d+) (.+)$/.exec(label);
  if (!match) return null;
  return { episode: match[1], timing: match[2] };
}

export function DetailSidebar({
  details,
  genres,
  genreSearchPrefix,
  watchSection,
  nextEpisodeLabel,
}: DetailSidebarProps) {
  const showGenresBlock = genres.length > 5;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={SECTION_TITLE}>DETAILS</p>
        <div style={BLOCK_STYLE}>
          {details
            .filter((row) => row.value != null && row.value !== "")
            .map((row, i, arr) => (
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
                  style={{ ...VALUE_STYLE, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
        </div>
      </div>

      {nextEpisodeLabel && (() => {
        const airing = parseAiringLabel(nextEpisodeLabel);
        return (
          <div className="detail-sidebar-section">
            <p className="detail-sidebar-section-title">NEXT EPISODE</p>
            <div className="detail-sidebar-block detail-sidebar-block--airing">
              <div className="detail-sidebar-airing-copy">
                {airing ? (
                  <>
                    <span className="detail-sidebar-airing-ep">EP {airing.episode}</span>
                    <span className="detail-sidebar-airing-timing">{airing.timing}</span>
                  </>
                ) : (
                  <span className="detail-sidebar-airing-timing">{nextEpisodeLabel}</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {watchSection && (
        <div className="detail-sidebar-section">
          <p className="detail-sidebar-section-title">{watchSection.title}</p>
          <div className="detail-sidebar-block detail-sidebar-block--links">
            {watchSection.links.length > 0 ? (
              watchSection.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-sidebar-watch-link"
                >
                  <span>{link.site}</span>
                  <ExternalLink size={10} className="detail-sidebar-watch-link-icon" aria-hidden />
                </a>
              ))
            ) : (
              <p className="detail-sidebar-empty">{watchSection.emptyMessage}</p>
            )}
          </div>
        </div>
      )}

      {showGenresBlock && (
        <div id="sidebar-genres">
          <p style={SECTION_TITLE}>GENRES</p>
          <div style={BLOCK_STYLE}>
            {genres.map((g) => (
              <Link
                key={g}
                href={`${genreSearchPrefix}${encodeURIComponent(g)}`}
                className="detail-sidebar-genre-link"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
