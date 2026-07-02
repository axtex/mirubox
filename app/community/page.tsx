import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getLists } from "@/lib/list-queries";
import { ListCard, CreateListCard } from "@/components/lists/ListCard";

export const metadata: Metadata = {
  title: "Community — mirubox",
};

const TABS = [
  { value: "news", label: "NEWS" },
  { value: "forum", label: "FORUM" },
  { value: "lists", label: "LISTS" },
  { value: "friends", label: "FRIENDS" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const STATIC_COPY: Record<Exclude<Tab, "lists">, { title: string; body: string }> = {
  news: {
    title: "Community news",
    body: "Announcements, spotlights, and updates from mirubox. Coming soon.",
  },
  forum: {
    title: "Forum",
    body: "Discuss anime, manga, and lists with the community. Coming soon.",
  },
  friends: {
    title: "Friends",
    body: "Follow friends, compare taste, and see what they're watching. Coming soon.",
  },
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

  const listType = ["official", "community", "mine"].includes(typeParam ?? "")
    ? (typeParam ?? "official")
    : "official";

  const isLoggedIn = !!session?.user?.id;
  const lists = tab === "lists" ? await getLists(listType, session?.user?.id ?? null) : [];

  const LIST_TABS = [
    { value: "official", label: "OFFICIAL" },
    { value: "community", label: "COMMUNITY" },
    ...(isLoggedIn ? [{ value: "mine", label: "MINE" }] : []),
  ];

  return (
    <div className="page-container py-8">
      <div style={{ marginBottom: 24 }}>
        <h1
          className="text-headline-lg font-display uppercase"
          style={{ marginBottom: 4 }}
        >
          COMMUNITY
        </h1>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
          }}
        >
          News, discussion, lists, and friends
        </p>
      </div>

      <nav
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 32,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {TABS.map(({ value, label }) => {
          const active = tab === value;
          return (
            <Link
              key={value}
              href={`/community?tab=${value}`}
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
      </nav>

      {tab === "lists" ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-subtle)",
                maxWidth: 420,
                lineHeight: 1.6,
              }}
            >
              Curated by mirubox and the community
            </p>

            {isLoggedIn && (
              <Link
                href="/lists/new"
                className="btn-primary shrink-0"
                style={{ fontSize: 10, letterSpacing: "0.08em" }}
              >
                + CREATE LIST
              </Link>
            )}
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
              {isLoggedIn && <CreateListCard />}
            </div>
          )}
        </>
      ) : (
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--fg-muted)",
              marginBottom: 8,
            }}
          >
            {STATIC_COPY[tab].title.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-subtle)",
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            {STATIC_COPY[tab].body}
          </p>
        </div>
      )}
    </div>
  );
}
