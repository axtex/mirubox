import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CompatibilityEntry } from "@/lib/community-feed";
import { getRankProgress } from "@/lib/ranks";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { FriendsSection } from "@/components/community/friends-shared";

interface TasteCompatibilityProps {
  compatibility: CompatibilityEntry[];
}

export function TasteCompatibilitySection({
  compatibility,
}: TasteCompatibilityProps): React.JSX.Element | null {
  if (compatibility.length === 0) return null;

  const allZero = compatibility.every((c) => c.overlapCount === 0);

  return (
    <FriendsSection label="TASTE COMPATIBILITY">
      {allZero ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "#3a3a45",
            margin: 0,
            padding: "8px 0",
          }}
        >
          Start tracking titles to see taste compatibility with friends.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {compatibility.map((entry) => {
            const rank = getRankProgress(entry.user.totalXP);
            const profileHref = entry.user.username
              ? `/u/${entry.user.username}`
              : null;

            return (
              <div
                key={entry.user.id}
                style={{
                  background: "#131316",
                  border: "1px solid #1f1f22",
                  borderRadius: 2,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {profileHref ? (
                  <Link href={profileHref} style={{ flexShrink: 0 }}>
                    <UserAvatar
                      userId={entry.user.id}
                      username={entry.user.username}
                      displayName={entry.user.displayName}
                      avatarUrl={entry.user.avatarUrl}
                      size={48}
                    />
                  </Link>
                ) : (
                  <UserAvatar
                    userId={entry.user.id}
                    username={entry.user.username}
                    displayName={entry.user.displayName}
                    avatarUrl={entry.user.avatarUrl}
                    size={48}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 3,
                      minWidth: 0,
                    }}
                  >
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        style={{
                          fontSize: 12,
                          color: "#e4e1e6",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {entry.user.displayName}
                      </Link>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#e4e1e6",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {entry.user.displayName}
                      </span>
                    )}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--primary)",
                        background: "var(--badge-earned-bg)",
                        border: "1.5px solid var(--badge-earned-border)",
                        borderRadius: 2,
                        padding: "1px 4px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {rank.name}
                    </span>
                  </div>

                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      margin: "0 0 3px",
                      color: entry.overlapCount > 0 ? "#9e9ea8" : "#3a3a45",
                    }}
                  >
                    {entry.overlapCount > 0 ? (
                      <>
                        <span style={{ color: "#e4e1e6", fontWeight: 600 }}>
                          {entry.overlapCount}
                        </span>{" "}
                        titles in common
                      </>
                    ) : (
                      "No titles in common yet"
                    )}
                  </p>

                  {entry.sharedGenres.length > 0 ? (
                    <p
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        margin: 0,
                        color: "#5a5a65",
                      }}
                    >
                      Both love:{" "}
                      <span style={{ color: "#9e9ea8" }}>
                        {entry.sharedGenres.join(" · ")}
                      </span>
                    </p>
                  ) : null}
                </div>

                {profileHref ? (
                  <Link
                    href={profileHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--primary)",
                      textDecoration: "none",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    VIEW
                    <ChevronRight size={12} strokeWidth={2} aria-hidden />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </FriendsSection>
  );
}
