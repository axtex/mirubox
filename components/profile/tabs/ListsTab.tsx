"use client";

import { useRouter } from "next/navigation";
import { ListCard } from "@/components/lists/ListCard";
import type { ProfileListCard } from "@/lib/profile-types";

interface ListsTabProps {
  isOwnProfile: boolean;
  yourLists: ProfileListCard[];
  likedLists: ProfileListCard[];
}

function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        color: "var(--fg-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

export function ListsTab({
  isOwnProfile,
  yourLists,
  likedLists,
}: ListsTabProps): React.JSX.Element {
  const router = useRouter();

  return (
    <div style={{ padding: "16px 0" }}>
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <SectionLabel>YOUR LISTS</SectionLabel>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => router.push("/lists/new")}
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--primary)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              + Create
            </button>
          ) : null}
        </div>
        {yourLists.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-faint)",
              padding: "8px 0",
              margin: 0,
            }}
          >
            {isOwnProfile ? "You haven't created any lists yet." : "No lists yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {yourLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </section>

      <div
        style={{
          height: 1,
          background: "var(--bg-elevated)",
          margin: "16px 0",
        }}
      />

      <section>
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>LIKED LISTS</SectionLabel>
        </div>
        {likedLists.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-faint)",
              padding: "8px 0",
              margin: 0,
            }}
          >
            No lists yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {likedLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
