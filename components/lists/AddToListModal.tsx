"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import type { ToastNotification } from "@/lib/xp";

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
    hasMedia?: boolean;
  }>;
}

interface ContainingList {
  slug: string;
  title: string;
}

async function fetchMineListsForMedia(mediaId: number): Promise<UserList[]> {
  const res = await fetch(`/api/lists?type=mine&mediaId=${mediaId}&take=50`);
  if (!res.ok) return [];
  const data = (await res.json()) as ListsResponse;
  return data.lists.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    entryCount: l.entryCount,
    hasMedia: l.hasMedia ?? false,
  }));
}

const CREATE_LIST_LINK_CLASS = "btn-primary shrink-0";
const CREATE_LIST_LINK_STYLE: React.CSSProperties = {
  minHeight: 28,
  padding: "4px 10px",
  fontSize: 9,
  letterSpacing: "0.08em",
};

const LIST_CHIP_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "5px 8px",
  textAlign: "left",
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  letterSpacing: "0.04em",
  color: "var(--primary)",
  textDecoration: "none",
  background: "var(--badge-earned-bg)",
  border: "1.5px solid var(--badge-earned-border)",
  borderRadius: 2,
};

interface Props {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  isLoggedIn: boolean;
  /** Full-width control matching detail sidebar blocks. */
  sidebar?: boolean;
}

export function AddToListButton({ mediaId, mediaType, isLoggedIn, sidebar = false }: Props) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const [containingLists, setContainingLists] = useState<ContainingList[]>([]);

  const refreshContainingLists = useCallback(async () => {
    if (!isLoggedIn) {
      setContainingLists([]);
      return;
    }
    const lists = await fetchMineListsForMedia(mediaId);
    setContainingLists(
      lists.filter((l) => l.hasMedia).map((l) => ({ slug: l.slug, title: l.title }))
    );
  }, [isLoggedIn, mediaId]);

  useEffect(() => {
    if (sidebar) void refreshContainingLists();
  }, [sidebar, refreshContainingLists]);

  function handleClick() {
    if (!isLoggedIn) {
      openAuthModal({ reason: "add this to a list", callbackUrl: pathname });
      return;
    }
    setOpen(true);
  }

  const handleListsChange = useCallback((lists: UserList[]) => {
    setContainingLists(
      lists.filter((l) => l.hasMedia).map((l) => ({ slug: l.slug, title: l.title }))
    );
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={sidebar ? "detail-sidebar-track-btn" : undefined}
        style={
          sidebar
            ? {
                width: "100%",
                padding: "5px 0",
                textAlign: "center",
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                letterSpacing: "0.04em",
                color: "var(--fg-muted)",
                border: "1px solid var(--bg-card-high)",
                borderRadius: 2,
                background: "transparent",
                cursor: "pointer",
              }
            : {
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
              }
        }
        onMouseEnter={
          sidebar
            ? undefined
            : (e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a3d";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)";
              }
        }
        onMouseLeave={
          sidebar
            ? undefined
            : (e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2d";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)";
              }
        }
      >
        {sidebar ? "+ ADD TO LIST" : "LIST +"}
      </button>

      {sidebar && containingLists.length > 0 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--bg-card-high)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {containingLists.map((list) => (
            <Link
              key={list.slug}
              href={`/lists/${list.slug}`}
              className="detail-sidebar-list-chip"
              style={LIST_CHIP_STYLE}
            >
              {list.title}
            </Link>
          ))}
        </div>
      )}

      {open && (
        <AddToListModal
          mediaId={mediaId}
          mediaType={mediaType}
          onClose={() => setOpen(false)}
          onListsChange={sidebar ? handleListsChange : undefined}
        />
      )}
    </>
  );
}

function AddToListModal({
  mediaId,
  mediaType,
  onClose,
  onListsChange,
}: {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  onClose: () => void;
  onListsChange?: (lists: UserList[]) => void;
}) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const onListsChangeRef = useRef(onListsChange);
  const { showToast } = useToast();

  useEffect(() => {
    onListsChangeRef.current = onListsChange;
  }, [onListsChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const enriched = await fetchMineListsForMedia(mediaId);
      setLists(enriched);
      onListsChangeRef.current?.(enriched);
    } catch {
      setLists([]);
      onListsChangeRef.current?.([]);
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
        setLists((prev) => {
          const next = prev.map((l) =>
            l.slug === list.slug
              ? { ...l, hasMedia: false, entryCount: l.entryCount - 1 }
              : l
          );
          onListsChangeRef.current?.(next);
          return next;
        });
      } else {
        const res = await fetch(`/api/lists/${list.slug}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        });
        if (res.ok) {
          const data = (await res.json()) as { notifications?: ToastNotification[] };
          data.notifications?.forEach((n) => showToast(n));
          setLists((prev) => {
            const next = prev.map((l) =>
              l.slug === list.slug
                ? { ...l, hasMedia: true, entryCount: l.entryCount + 1 }
                : l
            );
            onListsChangeRef.current?.(next);
            return next;
          });
        }
      }
    } finally {
      setPending(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
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
        role="dialog"
        aria-modal="true"
        aria-label="Add to a list"
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
          <IconButton onClick={onClose} aria-label="Close">
            <X size={14} />
          </IconButton>
        </div>

        {/* List rows */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {loading ? (
            <StatusMessage block variant="muted" style={{ padding: "16px" }}>
              Loading…
            </StatusMessage>
          ) : lists.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <StatusMessage block variant="muted" style={{ marginBottom: 12 }}>
                You haven&apos;t created any lists yet.
              </StatusMessage>
              <Link
                href="/lists/new"
                target="_blank"
                rel="noopener noreferrer"
                className={CREATE_LIST_LINK_CLASS}
                style={CREATE_LIST_LINK_STYLE}
              >
                + CREATE LIST
              </Link>
            </div>
          ) : (
            lists.map((list, index) => (
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
                  borderBottom:
                    index < lists.length - 1 ? "1px solid var(--border)" : "none",
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
                      margin: "0 0 2px",
                    }}
                  >
                    {list.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--fg-muted)",
                      margin: 0,
                    }}
                  >
                    {list.entryCount} titles
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                    marginLeft: 12,
                    padding: "4px 10px",
                    borderRadius: 2,
                    ...(list.hasMedia
                      ? {
                          background: "var(--primary-dim)",
                          border: "1px solid rgba(232, 23, 63, 0.3)",
                          color: "var(--primary)",
                        }
                      : {
                          background: "var(--bg-card-high)",
                          border: "1px solid var(--bg-card-high)",
                          color: "var(--fg-muted)",
                        }),
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
              padding: "8px 16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Link
              href="/lists/new"
              target="_blank"
              rel="noopener noreferrer"
              className={CREATE_LIST_LINK_CLASS}
              style={CREATE_LIST_LINK_STYLE}
            >
              + CREATE LIST
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
