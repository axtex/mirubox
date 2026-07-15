"use client";

import { useRef, useState, type CSSProperties, type DragEvent } from "react";
import Link from "next/link";
import { Check, Upload } from "lucide-react";
import { daysAgoLabel, type ImportResult } from "@/lib/import-utils";

type Tab = "ANILIST" | "MAL";
type Phase = "idle" | "importing" | "success" | "error";

interface Props {
  anilistUsername: string | null;
  lastAnilistImport: string | null;
  lastMalImport: string | null;
}

const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  color: "var(--fg-muted)",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 2,
  padding: "8px 12px",
  fontFamily: "var(--font-space-mono)",
  fontSize: 12,
  color: "var(--fg)",
  outline: "none",
};

const noteStyle: CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  color: "var(--fg-muted)",
  lineHeight: 1.7,
  marginTop: 12,
};

const pillBase: CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
  padding: "5px 14px",
  borderRadius: 2,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
  border: "none",
};

function pillStyle(active: boolean): CSSProperties {
  return {
    ...pillBase,
    background: active ? "var(--primary)" : "var(--bg-elevated)",
    color: active ? "#fff" : "var(--fg-muted)",
    border: active ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
  };
}

export function ImportClient({
  anilistUsername: initialUsername,
  lastAnilistImport,
  lastMalImport,
}: Props): React.JSX.Element {
  const [tab, setTab] = useState<Tab>("ANILIST");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const [storedUsername, setStoredUsername] = useState(initialUsername);
  const [useStored, setUseStored] = useState(Boolean(initialUsername && lastAnilistImport));
  const [username, setUsername] = useState(initialUsername ?? "");

  const [animeFile, setAnimeFile] = useState<File | null>(null);
  const [mangaFile, setMangaFile] = useState<File | null>(null);

  function resetForm() {
    setPhase("idle");
    setError("");
    setResult(null);
  }

  async function handleAnilistImport(overrideUsername?: string) {
    const raw = (overrideUsername ?? username).trim().replace(/^@/, "");
    if (!raw) {
      setPhase("error");
      setError("Enter an AniList username.");
      return;
    }

    setPhase("importing");
    setError("");

    try {
      const res = await fetch("/api/import/anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: raw }),
      });

      if (res.status === 404) {
        setPhase("error");
        setError("AniList username not found. Check your username and try again.");
        return;
      }
      if (res.status === 429) {
        setPhase("error");
        setError("Too many imports. Please wait and try again later.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(data?.error ?? "Import failed. Please try again.");
        return;
      }

      const data = (await res.json()) as ImportResult;
      setStoredUsername(raw);
      setUseStored(true);
      setUsername(raw);
      setResult(data);
      setPhase("success");
    } catch {
      setPhase("error");
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleMalImport() {
    if (!animeFile && !mangaFile) return;
    setPhase("importing");
    setError("");

    const formData = new FormData();
    if (animeFile) formData.append("animeFile", animeFile);
    if (mangaFile) formData.append("mangaFile", mangaFile);

    try {
      const res = await fetch("/api/import/mal", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        setPhase("error");
        setError("Too many imports. Please wait and try again later.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(data?.error ?? "Import failed. Check your XML files and try again.");
        return;
      }

      const data = (await res.json()) as ImportResult;
      setResult(data);
      setPhase("success");
    } catch {
      setPhase("error");
      setError("Something went wrong.");
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-5">
        <div>
          <h1 className="text-headline-lg font-display uppercase">IMPORT</h1>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              marginTop: 4,
            }}
          >
            Import your anime and manga lists from AniList or MAL
          </p>
        </div>
      </div>

      {phase === "idle" && (
        <div className="flex gap-1.5 mb-5">
          {(["ANILIST", "MAL"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={pillStyle(tab === t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {phase === "importing" && <ImportingState />}

      {phase === "success" && result && (
        <SuccessState result={result} onAgain={resetForm} />
      )}

      {phase === "error" && (
        <ErrorState message={error} onAgain={resetForm} />
      )}

      {phase === "idle" && tab === "ANILIST" && (
        <div style={{ maxWidth: 480 }}>
          {useStored && storedUsername && lastAnilistImport ? (
            <>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  marginBottom: 12,
                }}
              >
                Last imported from AniList ({storedUsername}) —{" "}
                {daysAgoLabel(new Date(lastAnilistImport))}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  onClick={() => handleAnilistImport(storedUsername)}
                >
                  RE-IMPORT AS {storedUsername.toUpperCase()}
                </button>
                <button
                  type="button"
                  className="btn-ghost w-full justify-center"
                  onClick={() => {
                    setUseStored(false);
                    setUsername("");
                  }}
                >
                  USE DIFFERENT USERNAME
                </button>
              </div>
            </>
          ) : (
            <>
              <label style={labelStyle}>ANILIST USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username or username"
                maxLength={21}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--fg-faint)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              />
              <button
                type="button"
                className="btn-primary w-full justify-center"
                style={{ marginTop: 14 }}
                onClick={() => handleAnilistImport()}
                disabled={!username.trim()}
              >
                IMPORT FROM ANILIST
              </button>
            </>
          )}
          <p style={noteStyle}>
            Your AniList list must be public. Ratings and progress are imported. Titles already in
            your tracker are skipped.
          </p>
        </div>
      )}

      {phase === "idle" && tab === "MAL" && (
        <div style={{ maxWidth: 480 }}>
          {lastMalImport && (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                marginBottom: 12,
              }}
            >
              Last MAL import — {daysAgoLabel(new Date(lastMalImport))}
            </p>
          )}
          <p style={{ ...noteStyle, marginTop: 0, marginBottom: 16 }}>
            How to export from MAL:
            <br />
            1. Go to myanimelist.net
            <br />
            2. Profile → Export
            <br />
            3. Click &apos;Export Anime List&apos; and &apos;Export Manga List&apos;
            <br />
            4. Upload both XML files below
          </p>

          <FileDropZone
            label="ANIME LIST (.xml)"
            file={animeFile}
            onFile={setAnimeFile}
          />
          <div style={{ height: 12 }} />
          <FileDropZone
            label="MANGA LIST (optional)"
            file={mangaFile}
            onFile={setMangaFile}
          />

          <button
            type="button"
            className="btn-primary w-full justify-center"
            style={{ marginTop: 14 }}
            disabled={!animeFile && !mangaFile}
            onClick={handleMalImport}
          >
            IMPORT FROM MAL
          </button>

          <p style={noteStyle}>
            Ratings and progress are imported. Titles already in your tracker are skipped. Large
            lists may take 30–60 seconds. Very large lists (500+ titles) may time out — import in
            batches by exporting seasonal lists if needed.
          </p>
        </div>
      )}
    </>
  );
}

function ImportingState(): React.JSX.Element {
  return (
    <div style={{ maxWidth: 480, paddingTop: 8 }}>
      <h2
        className="font-display uppercase"
        style={{ fontSize: 18, letterSpacing: "0.04em", marginBottom: 16 }}
      >
        Importing...
      </h2>
      <div
        style={{
          width: "100%",
          height: 4,
          background: "var(--border)",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div className="shimmer" style={{ position: "absolute", inset: 0 }} />
      </div>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          marginTop: 12,
        }}
      >
        This may take a minute for large lists...
      </p>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          color: "var(--fg-subtle)",
          marginTop: 6,
        }}
      >
        Fetching and matching titles
      </p>
    </div>
  );
}

function SuccessState({
  result,
  onAgain,
}: {
  result: ImportResult;
  onAgain: () => void;
}): React.JSX.Element {
  return (
    <div style={{ maxWidth: 480, paddingTop: 8 }}>
      <Check size={28} style={{ color: "var(--success)", marginBottom: 12 }} strokeWidth={2.5} />
      <h2
        className="font-display uppercase"
        style={{ fontSize: 22, letterSpacing: "0.04em", marginBottom: 16 }}
      >
        Import complete
      </h2>
      <div
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          lineHeight: 1.9,
          marginBottom: 20,
        }}
      >
        <p>Anime imported: {result.animeImported}</p>
        <p>Manga imported: {result.mangaImported}</p>
        <p>Skipped (already tracked): {result.skipped}</p>
        <p>Not found: {result.notFound}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href="/tracker" className="btn-primary justify-center" style={{ flex: 1 }}>
          GO TO TRACKER
        </Link>
        <button type="button" className="btn-ghost justify-center" style={{ flex: 1 }} onClick={onAgain}>
          IMPORT AGAIN
        </button>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onAgain,
}: {
  message: string;
  onAgain: () => void;
}): React.JSX.Element {
  return (
    <div style={{ maxWidth: 480, paddingTop: 8 }}>
      <h2
        className="font-display uppercase"
        style={{ fontSize: 22, letterSpacing: "0.04em", marginBottom: 12, color: "var(--primary)" }}
      >
        Import failed
      </h2>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      <button type="button" className="btn-primary" onClick={onAgain}>
        TRY AGAIN
      </button>
    </div>
  );
}

function FileDropZone({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function acceptFile(f: File | undefined) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xml")) return;
    onFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "28px 16px",
          borderRadius: 2,
          border: `1px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
          background: dragOver ? "var(--primary-dim)" : "var(--bg-card)",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <Upload size={18} style={{ color: "var(--fg-subtle)" }} />
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: file ? "var(--fg)" : "var(--fg-muted)",
            letterSpacing: "0.04em",
          }}
        >
          {file ? file.name : "Drop XML here or click to select"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        style={{ display: "none" }}
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
