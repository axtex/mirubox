import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getLists } from "@/lib/list-queries";
import { ListCard, CreateListButton } from "@/components/lists/ListCard";
import { FriendsTab } from "@/components/community/FriendsTab";
import { NowWatchingSection } from "@/components/community/NowWatchingSection";
import { RecentlyCompletedSection } from "@/components/community/RecentlyCompletedSection";
import { RecentReviewsSection } from "@/components/community/RecentReviewsSection";
import { TasteCompatibilitySection } from "@/components/community/TasteCompatibilitySection";
import { loadFriendsPageData } from "@/lib/community-feed";

export const metadata: Metadata = {
  title: "Lists — mirubox",
};

const TABS = [
  { value: "news", label: "NEWS" },
  { value: "forum", label: "FORUM" },
  { value: "lists", label: "LISTS" },
  { value: "friends", label: "FRIENDS" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const TAB_TITLES: Record<Exclude<Tab, "lists">, string> = {
  forum: "FORUM",
  news: "NEWS",
  friends: "FRIENDS",
};

interface PageProps {
  searchParams: Promise<{ tab?: string; type?: string }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const session = await auth();
  const { tab: tabParam, type: typeParam } = await searchParams;

  const tab: Tab = TABS.some((t) => t.value === tabParam)
    ? (tabParam as Tab)
    : "lists";

  if (tab === "friends") {
    if (!session?.user?.id) {
      return (
        <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
              }}
            >
              <Link
                href="/auth/signin?callbackUrl=/community?tab=friends"
                style={{
                  color: "var(--primary)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Sign in
              </Link>{" "}
              to find friends and see their activity.
            </p>
          </div>
        </div>
      );
    }

    const data = await loadFriendsPageData(session.user.id);

    return (
      <div className="py-8">
        <FriendsTab
          initialFeed={data.feed}
          initialHasMore={data.hasMore}
          initialCursor={data.nextCursor}
          isFollowingAnyone={data.isFollowingAnyone}
        >
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 24, marginBottom: 24 }}
          >
            <div style={{ minWidth: 0 }}>
              <NowWatchingSection items={data.nowWatching} />
            </div>
            <div style={{ minWidth: 0 }}>
              <RecentlyCompletedSection items={data.recentlyCompleted} />
            </div>
            <div style={{ minWidth: 0 }}>
              <RecentReviewsSection items={data.recentReviews} />
            </div>
            <div style={{ minWidth: 0 }}>
              <TasteCompatibilitySection compatibility={data.compatibility} />
            </div>
          </div>
        </FriendsTab>
      </div>
    );
  }

  const listType = ["official", "community", "mine"].includes(typeParam ?? "")
    ? (typeParam ?? "official")
    : "official";

  if (tab !== "lists") {
    return (
      <div className="py-8">
        <h1 className="text-headline-lg font-display uppercase">{TAB_TITLES[tab]}</h1>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
            marginTop: 4,
          }}
        >
          Coming soon
        </p>
      </div>
    );
  }

  const isLoggedIn = !!session?.user?.id;
  const lists = await getLists(listType, session?.user?.id ?? null);
  const canCreateList = listType === "community" || listType === "mine";

  const LIST_TABS = [
    { value: "official", label: "OFFICIAL" },
    { value: "community", label: "COMMUNITY" },
    ...(isLoggedIn ? [{ value: "mine", label: "MINE" }] : []),
  ];

  return (
    <div className="py-8">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <h1 className="text-headline-lg font-display uppercase">LISTS</h1>

        {canCreateList ? <CreateListButton /> : null}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {LIST_TABS.map(({ value, label }) => {
          const active = listType === value;
          return (
            <Link
              key={value}
              href={`/community?tab=lists&type=${value}`}
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "10px 14px",
                color: active ? "var(--primary)" : "var(--fg-muted)",
                borderBottom: active
                  ? "1.5px solid var(--primary)"
                  : "1.5px solid transparent",
                marginBottom: -1,
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {lists.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            padding: "48px 0",
          }}
        >
          {listType === "mine"
            ? "You haven't created any lists yet."
            : listType === "official"
              ? "No official lists yet."
              : "No community lists yet. Be the first to create one."}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
