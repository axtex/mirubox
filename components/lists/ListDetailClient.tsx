"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Pencil, Plus, X } from "lucide-react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { LikeButton } from "@/components/lists/LikeButton";
import { AddTitlesModal, type AddedTitle } from "@/components/lists/AddTitlesModal";
import { ListSettingsModal } from "@/components/lists/ListSettingsModal";
import { IconButton, outlineBtnBase } from "@/components/ui/IconButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface ListEntryView {
  card: AnimeCardType;
  note: string | null;
}

interface Props {
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  isOfficial: boolean;
  isOwner: boolean;
  username: string;
  mediaType: "ANIME" | "MANGA";
  entryCount: number;
  likeCount: number;
  isLiked: boolean;
  isLoggedIn: boolean;
  updatedLabel: string;
  entries: ListEntryView[];
}

function cardFromAdded(title: AddedTitle): AnimeCardType {
  return {
    id: title.id,
    title: { romaji: title.title, english: title.title, native: null },
    coverImage: { large: title.coverImage ?? "", extraLarge: title.coverImage ?? "" },
    bannerImage: null,
    genres: [],
    episodes: null,
    chapters: null,
    status: null,
    season: null,
    seasonYear: null,
    averageScore: null,
    popularity: null,
    format: null,
    type: title.type,
    tags: [],
    rankings: [],
  };
}

const manageBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.8)",
  border: "1px solid var(--bg-card-high)",
  borderRadius: 2,
  color: "#fff",
  padding: 0,
};

export function ListDetailClient({
  slug,
  title: initialTitle,
  description: initialDescription,
  isPublic: initialIsPublic,
  isOfficial,
  isOwner,
  username,
  mediaType,
  likeCount,
  isLiked,
  isLoggedIn,
  updatedLabel,
  entries: initialEntries,
}: Props): React.JSX.Element {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [entries, setEntries] = useState(initialEntries);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const dragIdRef = useRef<number | null>(null);
  const entryCount = entries.length;

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsPublic(initialIsPublic);
    setEntries((prev) => {
      const serverIds = new Set(initialEntries.map((e) => e.card.id));
      const pending = prev.filter((e) => !serverIds.has(e.card.id));
      return pending.length === 0 ? initialEntries : [...initialEntries, ...pending];
    });
  }, [initialTitle, initialDescription, initialIsPublic, initialEntries]);

  function handleAdded(added: AddedTitle) {
    setEntries((prev) => {
      if (prev.some((e) => e.card.id === added.id)) return prev;
      return [...prev, { card: cardFromAdded(added), note: null }];
    });
    router.refresh();
  }

  async function persistOrder(next: ListEntryView[]) {
    try {
      const res = await fetch(`/api/lists/${slug}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds: next.map((e) => e.card.id) }),
      });
      if (!res.ok) {
        setRemoveError("Could not save order.");
        return;
      }
      router.refresh();
    } catch {
      setRemoveError("Could not save order.");
    }
  }

  function reorder(fromId: number, toId: number) {
    if (fromId === toId) return;
    setEntries((prev) => {
      const fromIndex = prev.findIndex((e) => e.card.id === fromId);
      const toIndex = prev.findIndex((e) => e.card.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      void persistOrder(next);
      return next;
    });
  }

  async function removeTitle(mediaId: number) {
    if (removingId !== null) return;
    if (entries.length <= 1) {
      setRemoveError("Lists need at least one title. Delete the list instead.");
      return;
    }
    setRemovingId(mediaId);
    setRemoveError(null);
    const prev = entries;
    setEntries((e) => e.filter((x) => x.card.id !== mediaId));
    try {
      const res = await fetch(`/api/lists/${slug}/entries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setEntries(prev);
        setRemoveError(data.error ?? "Could not remove title.");
        return;
      }
      router.refresh();
    } catch {
      setEntries(prev);
      setRemoveError("Could not remove title.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        {isOfficial && (
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "#e8173f",
                background: "rgba(232,23,63,0.1)",
                border: "1px solid rgba(232,23,63,0.2)",
                borderRadius: 2,
                padding: "2px 6px",
                letterSpacing: "0.06em",
              }}
            >
              ✦ OFFICIAL LIST
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h1 className="text-headline-lg font-display" style={{ margin: 0, minWidth: 0 }}>
            {title}
          </h1>
          {isOwner && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexShrink: 0 }}>
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setManaging((m) => !m);
                    setRemoveError(null);
                    setDragId(null);
                    setDropTargetId(null);
                  }}
                  style={{
                    ...outlineBtnBase,
                    height: 28,
                    padding: "0 10px",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {managing ? "DONE" : "MANAGE"}
                </button>
              )}
              <IconButton aria-label="Add titles" onClick={() => setAddOpen(true)}>
                <Plus size={13} strokeWidth={2} aria-hidden />
              </IconButton>
              <IconButton aria-label="Edit list" onClick={() => setSettingsOpen(true)}>
                <Pencil size={13} strokeWidth={2} aria-hidden />
              </IconButton>
            </div>
          )}
        </div>

        {description ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 12,
              color: "var(--fg-muted)",
              maxWidth: 560,
              lineHeight: 1.55,
              marginBottom: 12,
            }}
          >
            {description}
          </p>
        ) : null}

        <p
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            margin: 0,
          }}
        >
          <span>
            {entryCount} {entryCount === 1 ? "title" : "titles"}
          </span>
          <span aria-hidden>·</span>
          <LikeButton
            slug={slug}
            initialLiked={isLiked}
            initialCount={likeCount}
            isLoggedIn={isLoggedIn}
            canLike={!isOwner}
          />
          <span aria-hidden>·</span>
          <span>
            by{" "}
            <Link
              href={`/u/${username}`}
              style={{
                color: "var(--fg)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {username}
            </Link>
          </span>
          <span aria-hidden>·</span>
          <span>updated {updatedLabel}</span>
          {!isPublic && isOwner ? (
            <>
              <span aria-hidden>·</span>
              <span style={{ color: "var(--fg-subtle)" }}>private</span>
            </>
          ) : null}
        </p>

        {removeError && (
          <StatusMessage variant="error" style={{ marginTop: 10 }}>
            {removeError}
          </StatusMessage>
        )}

        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>

      {entries.length === 0 ? (
        <StatusMessage variant="muted" style={{ padding: "32px 0", fontSize: 12, textTransform: "none", letterSpacing: "0.02em" }}>
          {isOwner
            ? "Add titles with the + button, or from any anime or manga detail page."
            : "This list is empty."}
        </StatusMessage>
      ) : (
        <div className="section-cards md:grid md:grid-cols-6 lg:grid-cols-7">
          {entries.map(({ card, note }) => {
            const isDropTarget = managing && dropTargetId === card.id && dragId !== card.id;
            return (
              <div
                key={card.id}
                draggable={managing}
                onDragStart={(e) => {
                  if (!managing) return;
                  dragIdRef.current = card.id;
                  setDragId(card.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(card.id));
                }}
                onDragOver={(e) => {
                  if (!managing || dragIdRef.current === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetId(card.id);
                }}
                onDragLeave={() => {
                  if (dropTargetId === card.id) setDropTargetId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromId = dragIdRef.current ?? Number(e.dataTransfer.getData("text/plain"));
                  if (Number.isFinite(fromId)) reorder(fromId, card.id);
                  dragIdRef.current = null;
                  setDragId(null);
                  setDropTargetId(null);
                }}
                onDragEnd={() => {
                  dragIdRef.current = null;
                  setDragId(null);
                  setDropTargetId(null);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  position: "relative",
                  height: "100%",
                  opacity: dragId === card.id ? 0.45 : 1,
                  outline: isDropTarget ? "1px solid var(--primary)" : undefined,
                  outlineOffset: isDropTarget ? 2 : undefined,
                  borderRadius: 4,
                }}
              >
                <div style={{ width: "100%", position: "relative" }}>
                  <AnimeCard anime={card} size="md" />
                  {managing && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        background: "rgba(0,0,0,0.45)",
                        borderRadius: 4,
                        pointerEvents: "none",
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`Remove ${card.title.english ?? card.title.romaji}`}
                        disabled={removingId === card.id}
                        onClick={() => void removeTitle(card.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                          ...manageBtnStyle,
                          pointerEvents: "auto",
                          cursor: removingId === card.id ? "default" : "pointer",
                        }}
                      >
                        <X size={14} strokeWidth={2} aria-hidden />
                      </button>
                      <span
                        aria-label={`Drag to reorder ${card.title.english ?? card.title.romaji}`}
                        style={{
                          ...manageBtnStyle,
                          pointerEvents: "auto",
                          cursor: "grab",
                        }}
                      >
                        <GripVertical size={14} strokeWidth={2} aria-hidden />
                      </span>
                    </div>
                  )}
                </div>
                {note && (
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      color: "var(--fg-subtle)",
                      fontStyle: "italic",
                      lineHeight: 1.4,
                      padding: "0 2px",
                    }}
                  >
                    {note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addOpen && (
        <AddTitlesModal
          slug={slug}
          mediaType={mediaType}
          existingMediaIds={entries.map((e) => e.card.id)}
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}

      {settingsOpen && (
        <ListSettingsModal
          slug={slug}
          initialTitle={title}
          initialDescription={description ?? ""}
          initialIsPublic={isPublic}
          onClose={() => setSettingsOpen(false)}
          onSaved={(next) => {
            setTitle(next.title);
            setDescription(next.description || null);
            setIsPublic(next.isPublic);
          }}
        />
      )}
    </>
  );
}
