"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserList {
  id: string;
  slug: string;
  title: string;
  entryCount: number;
  hasMedia: boolean;
}

interface ListsResponse {
  lists: Array<{
    id: string;
    slug: string;
    title: string;
    entryCount: number;
    isLikedByCurrentUser: boolean;
  }>;
}

interface EntriesResponse {
  entries: Array<{ mediaId: number }>;
}

interface Props {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  isLoggedIn: boolean;
}

export function AddToListButton({ mediaId, mediaType, isLoggedIn }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/signin");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          letterSpacing: "0.08em",
          padding: "7px 14px",
          border: "1px solid #2a2a2d",
          borderRadius: 2,
          background: "transparent",
          color: "var(--fg-muted)",
          cursor: "pointer",
          transition: "border-color 0.15s ease, color 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a3d";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2d";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)";
        }}
      >
        LIST +
      </button>

      {open && (
        <AddToListModal
          mediaId={mediaId}
          mediaType={mediaType}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AddToListModal({
  mediaId,
  mediaType,
  onClose,
}: {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  onClose: () => void;
}) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const [listsRes, entriesPromises] = await Promise.all([
        fetch("/api/lists?type=mine").then((r) => r.json() as Promise<ListsResponse>),
        [] as Promise<EntriesResponse>[],
      ]);
      void entriesPromises;

      // For each list, check if this media is already in it
      const enriched = await Promise.all(
        listsRes.lists.map(async (l) => {
          try {
            const detail = await fetch(`/api/lists/${l.slug}`).then(
              (r) => r.json() as Promise<{ entries: Array<{ mediaId: number }> }>
            );
            const hasMedia = detail.entries?.some((e) => e.mediaId === mediaId) ?? false;
            return { id: l.id, slug: l.slug, title: l.title, entryCount: l.entryCount, hasMedia };
          } catch {
            return { id: l.id, slug: l.slug, title: l.title, entryCount: l.entryCount, hasMedia: false };
          }
        })
      );
      setLists(enriched);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [mediaId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function toggle(list: UserList) {
    if (pending) return;
    setPending(list.slug);
    try {
      if (list.hasMedia) {
        await fetch(`/api/lists/${list.slug}/entries`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId }),
        });
        setLists((prev) =>
          prev.map((l) =>
            l.slug === list.slug
              ? { ...l, hasMedia: false, entryCount: l.entryCount - 1 }
              : l
          )
        );
      } else {
        await fetch(`/api/lists/${list.slug}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        });
        setLists((prev) =>
          prev.map((l) =>
            l.slug === list.slug
              ? { ...l, hasMedia: true, entryCount: l.entryCount + 1 }
              : l
          )
        );
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          width: "100%",
          maxWidth: 360,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--fg)",
            }}
          >
            ADD TO A LIST
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List rows */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                padding: "16px",
                textAlign: "center",
              }}
            >
              Loading…
            </p>
          ) : lists.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  marginBottom: 12,
                }}
              >
                You haven&apos;t created any lists yet.
              </p>
              <Link
                href="/lists/new"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--primary)",
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                }}
              >
                + Create your first list →
              </Link>
            </div>
          ) : (
            lists.map((list) => (
              <button
                key={list.slug}
                onClick={() => toggle(list)}
                disabled={pending === list.slug}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  cursor: pending === list.slug ? "default" : "pointer",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.1s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 11,
                      color: "var(--fg)",
                      marginBottom: 2,
                    }}
                  >
                    {list.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {list.entryCount} titles
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: list.hasMedia ? "var(--primary)" : "var(--fg-muted)",
                    flexShrink: 0,
                    marginLeft: 12,
                  }}
                >
                  {list.hasMedia ? "✓ Added" : "+ Add"}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Create new list link */}
        {lists.length > 0 && (
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Link
              href="/lists/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                letterSpacing: "0.06em",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              + Create new list
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
