import Link from "next/link";
import type { NowWatchingItem } from "@/lib/community-feed";
import { timeAgo } from "@/lib/time-ago";
import {
  CoverThumb,
  FriendsSection,
  InlineUserLabel,
  mediaHref,
  mediaTitle,
} from "@/components/community/friends-shared";

interface NowWatchingSectionProps {
  items: NowWatchingItem[];
}

export function NowWatchingSection({
  items,
}: NowWatchingSectionProps): React.JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <FriendsSection label="CURRENTLY UP TO">
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => {
          const href = mediaHref(item.media.type, item.media.id);
          const isLast = i === items.length - 1;
          const verb =
            item.media.type === "MANGA" ? "is reading" : "is watching";

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: isLast ? "none" : "1px solid #1a1a1d",
              }}
            >
              <CoverThumb
                src={item.media.coverImage}
                href={href}
                width={28}
                height={42}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <InlineUserLabel user={item.user} trailing={verb} />
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: "#e4e1e6",
                    fontWeight: 500,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Link
                    href={href}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {mediaTitle(item.media)}
                  </Link>
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 8,
                  color: "#3a3a45",
                  flexShrink: 0,
                }}
              >
                {timeAgo(item.updatedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </FriendsSection>
  );
}
