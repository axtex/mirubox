"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/community/SectionLabel";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { getRankProgress } from "@/lib/ranks";
import type { UserSearchResult } from "@/app/api/users/search/route";

const DEBOUNCE_MS = 250;

export interface UserSearchBarProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function UserSearchBar({
  inputRef,
}: UserSearchBarProps): React.JSX.Element {
  const router = useRouter();
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string): Promise<void> => {
    const normalized = q.trim().toLowerCase().replace(/^@/, "");
    if (!normalized) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(normalized)}`
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { users: UserSearchResult[] };
      setResults(data.users);
      setActiveIndex(data.users.length > 0 ? 0 : -1);
      setOpen(true);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void search(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function goToUser(username: string): void {
    setOpen(false);
    router.push(`/u/${username}`);
  }

  function handleGo(): void {
    const normalized = query.trim().toLowerCase().replace(/^@/, "");
    if (!normalized) return;

    if (activeIndex >= 0 && results[activeIndex]) {
      goToUser(results[activeIndex].username);
      return;
    }
    if (results.length === 1) {
      goToUser(results[0].username);
      return;
    }
    void search(query);
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) =>
        results.length === 0 ? -1 : Math.min(i + 1, results.length - 1)
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleGo();
    }
  }

  const showDropdown =
    open && (loading || searched) && query.trim().length > 0;

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>FIND</SectionLabel>
      <div ref={containerRef} style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0 || searched) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="@username"
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-card-high)",
              borderRadius: 2,
              padding: "9px 12px",
              fontFamily: "var(--font-space-mono)",
              fontSize: 12,
              color: "var(--fg)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleGo}
            style={{
              flexShrink: 0,
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 2,
              padding: "7px 14px",
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            GO
          </button>
        </div>

        {showDropdown ? (
          <div
            role="listbox"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "100%",
              marginTop: 4,
              zIndex: 40,
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-card-high)",
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              overflow: "hidden",
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {loading && results.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  padding: "12px 14px",
                  margin: 0,
                }}
              >
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  padding: "12px 14px",
                  margin: 0,
                }}
              >
                No users found
              </p>
            ) : (
              results.map((user, i) => {
                const rank = getRankProgress(user.totalXP);
                const active = i === activeIndex;
                return (
                  <Link
                    key={user.id}
                    href={`/u/${user.username}`}
                    role="option"
                    aria-selected={active}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 14px",
                      borderBottom:
                        i === results.length - 1
                          ? "none"
                          : "1px solid #1a1a1d",
                      textDecoration: "none",
                      background: active ? "var(--bg-card)" : "transparent",
                      transition: "background 0.1s ease",
                    }}
                  >
                    <UserAvatar
                      userId={user.id}
                      username={user.username}
                      displayName={user.displayName}
                      avatarUrl={user.avatarUrl}
                      size={32}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 11,
                          color: "var(--fg-subtle)",
                          margin: "0 0 2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        @{user.username}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
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
                          {user.displayName}
                        </span>
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
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
