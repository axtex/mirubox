"use client";

import { UserSearchBar } from "@/components/community/UserSearchBar";
import { ActivityFeed } from "@/components/community/ActivityFeed";
import type { FeedEntry } from "@/lib/community-feed";

interface FriendsTabProps {
  initialFeed: FeedEntry[];
  initialHasMore: boolean;
  initialCursor: string | null;
  isFollowingAnyone: boolean;
  children?: React.ReactNode;
}

export function FriendsTab({
  initialFeed,
  initialHasMore,
  initialCursor,
  isFollowingAnyone,
  children,
}: FriendsTabProps): React.JSX.Element {
  return (
    <>
      <UserSearchBar />

      {!isFollowingAnyone ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "#5a5a65",
              margin: 0,
            }}
          >
            Follow people to see what they&apos;re watching, reading, and
            thinking.
          </p>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "#3a3a45",
              margin: "8px 0 0",
            }}
          >
            Search for a username above to get started.
          </p>
        </div>
      ) : (
        <>
          {children}
          <ActivityFeed
            initialFeed={initialFeed}
            initialHasMore={initialHasMore}
            initialCursor={initialCursor}
            isFollowingAnyone={isFollowingAnyone}
          />
        </>
      )}
    </>
  );
}
