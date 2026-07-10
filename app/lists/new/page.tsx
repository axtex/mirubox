"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";

type Visibility = "public" | "private";
type MediaType = "ANIME" | "MANGA";

interface SearchResult {
  id: number;
  title: string;
  coverImage: string | null;
  format: string | null;
  seasonYear: number | null;
  type: string;
}

interface SelectedTitle {
  id: number;
  title: string;
  coverImage: string | null;
  type: MediaType;
}

export default function NewListPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchType, setSearchType] = useState<MediaType>("ANIME");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedTitle[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function runSearch(nextQuery: string, type: MediaType) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nextQuery.trim().length < 2) return;
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/quick?q=${encodeURIComponent(nextQuery.trim())}&type=${type}`
        );
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    runSearch(value, searchType);
  }

  function handleSearchTypeChange(type: MediaType) {
    setSearchType(type);
    runSearch(query, type);
  }

  function addTitle(result: SearchResult) {
    if (selected.some((s) => s.id === result.id)) return;
    setSelected((prev) => [
      ...prev,
      { id: result.id, title: result.title, coverImage: result.coverImage, type: searchType },
    ]);
    setQuery("");
    setResults([]);
  }

  function removeTitle(id: number) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("List name is required.");
      return;
    }
    if (selected.length < 1) {
      setError("Add at least one title to create a list.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic: visibility === "public",
          entries: selected.map((s) => ({ mediaId: s.id, mediaType: s.type })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const created = (await res.json()) as { slug: string };
      router.push(`/lists/${created.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1b1b1e",
    border: "1px solid #2a2a2d",
    borderRadius: 2,
    padding: "8px 12px",
    fontFamily: "var(--font-space-mono)",
    fontSize: 12,
    color: "var(--fg)",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-space-mono)",
    fontSize: 10,
    color: "var(--fg-muted)",
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="page-container py-8" style={{ maxWidth: 560 }}>
        <Link
          href="/lists"
          className="mb-5 flex w-fit items-center gap-1.5"
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0 -ml-[5px]" strokeWidth={2} />
          LISTS
        </Link>

        <h1
          className="text-headline-md font-display"
          style={{ marginBottom: 28, textTransform: "uppercase" }}
        >
          Create List
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>LIST NAME</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="e.g. My favourite isekai"
              maxLength={80}
              style={inputStyle}
            />
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-subtle)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {title.length}/80
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>
              DESCRIPTION <span style={{ color: "var(--fg-subtle)" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="What's this list about?"
              maxLength={300}
              style={{ ...inputStyle, height: 80, resize: "vertical" }}
            />
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-subtle)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {description.length}/300
            </p>
          </div>

          {/* Titles */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>TITLES</label>
              <div style={{ display: "flex", gap: 0 }}>
                {(["ANIME", "MANGA"] as MediaType[]).map((t) => {
                  const active = searchType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSearchTypeChange(t)}
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        letterSpacing: "0.06em",
                        padding: "4px 10px",
                        border: "1px solid #2a2a2d",
                        borderRadius: t === "ANIME" ? "2px 0 0 2px" : "0 2px 2px 0",
                        background: active ? "var(--primary)" : "transparent",
                        color: active ? "#fff" : "var(--fg-muted)",
                        cursor: "pointer",
                        marginLeft: t === "MANGA" ? -1 : 0,
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={`Search ${searchType.toLowerCase()} to add…`}
                style={inputStyle}
              />
              {query.trim().length >= 2 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 3,
                    maxHeight: 260,
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {searching ? (
                    <p
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 10,
                        color: "var(--fg-subtle)",
                        padding: "10px 12px",
                      }}
                    >
                      Searching…
                    </p>
                  ) : results.length === 0 ? (
                    <p
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 10,
                        color: "var(--fg-subtle)",
                        padding: "10px 12px",
                      }}
                    >
                      No results.
                    </p>
                  ) : (
                    results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => addTitle(r)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 28,
                            height: 40,
                            flexShrink: 0,
                            background: "var(--bg-card)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          {r.coverImage && (
                            <Image src={r.coverImage} alt="" fill sizes="28px" className="object-cover" />
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-space-mono)",
                            fontSize: 11,
                            color: "var(--fg)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.title}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selected.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "#5a5a65",
                  marginTop: 8,
                }}
              >
                Add at least one title to create a list.
              </p>
            ) : (
              <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
                {selected.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      color: "var(--fg)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      padding: "4px 6px 4px 8px",
                    }}
                  >
                    {s.title}
                    <button
                      type="button"
                      onClick={() => removeTitle(s.id)}
                      aria-label={`Remove ${s.title}`}
                      style={{
                        display: "flex",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--fg-muted)",
                        padding: 0,
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <div>
            <label style={labelStyle}>VISIBILITY</label>
            <div style={{ display: "flex", gap: 0 }}>
              {(["public", "private"] as Visibility[]).map((v) => {
                const active = visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      padding: "7px 16px",
                      border: "1px solid #2a2a2d",
                      borderRadius: v === "public" ? "2px 0 0 2px" : "0 2px 2px 0",
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--fg-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      marginRight: v === "public" ? -1 : 0,
                    }}
                  >
                    {v.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--primary)",
              }}
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={submitting || selected.length < 1}
              className="btn-primary"
              style={{ opacity: submitting || selected.length < 1 ? 0.5 : 1 }}
            >
              {submitting ? "CREATING..." : "CREATE LIST"}
            </button>
            <Link href="/lists" className="btn-ghost">
              CANCEL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
