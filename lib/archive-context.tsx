"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

export interface ArchiveEntry {
  status: string;
  favourite: boolean;
}

/** Watchlist rows used only for favourites — excluded from tracker/archive UI. */
export const FAVOURITE_ONLY_STATUS = "FAVOURITE";

export function isTrackedEntry(entry: ArchiveEntry | null | undefined): boolean {
  return entry != null && entry.status !== FAVOURITE_ONLY_STATUS;
}

interface ArchiveContextValue {
  isLoggedIn: boolean;
  archiveMap: Map<number, ArchiveEntry>;
  addToArchive: (mediaId: number, mediaType: string, status?: string) => Promise<void>;
  updateStatus: (mediaId: number, status: string) => Promise<void>;
  removeFromArchive: (mediaId: number) => Promise<void>;
  toggleFavourite: (mediaId: number, mediaType: string) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue>({
  isLoggedIn: false,
  archiveMap: new Map(),
  addToArchive: async () => {},
  updateStatus: async () => {},
  removeFromArchive: async () => {},
  toggleFavourite: async () => {},
});

export function ArchiveProvider({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: ReactNode;
}) {
  const [archiveMap, setArchiveMap] = useState<Map<number, ArchiveEntry>>(new Map());
  // Ref always holds latest map — lets callbacks avoid stale closures
  const mapRef = useRef(archiveMap);
  useEffect(() => { mapRef.current = archiveMap; }, [archiveMap]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/archive/ids")
      .then((r) => r.json() as Promise<{ entries: { id: number; status: string; favourite: boolean }[] }>)
      .then((data) => {
        setArchiveMap(
          new Map(data.entries.map((e) => [e.id, { status: e.status, favourite: e.favourite }]))
        );
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const addToArchive = useCallback(
    async (mediaId: number, mediaType: string, status = "PLANNED") => {
      const prev = mapRef.current.get(mediaId);
      setArchiveMap((m) =>
        new Map(m).set(mediaId, { status, favourite: prev?.favourite ?? false })
      );
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: mediaId, status, mediaType }),
        });
        if (!res.ok) throw new Error("api error");
      } catch {
        setArchiveMap((m) => {
          const next = new Map(m);
          if (prev === undefined) next.delete(mediaId);
          else next.set(mediaId, prev);
          return next;
        });
      }
    },
    []
  );

  const updateStatus = useCallback(async (mediaId: number, status: string) => {
    const prev = mapRef.current.get(mediaId);
    setArchiveMap((m) =>
      new Map(m).set(mediaId, { status, favourite: prev?.favourite ?? false })
    );
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, status }),
      });
      if (!res.ok) throw new Error("api error");
    } catch {
      setArchiveMap((m) => {
        const next = new Map(m);
        if (prev === undefined) next.delete(mediaId);
        else next.set(mediaId, prev);
        return next;
      });
    }
  }, []);

  const removeFromArchive = useCallback(async (mediaId: number) => {
    const prev = mapRef.current.get(mediaId);
    setArchiveMap((m) => {
      const next = new Map(m);
      next.delete(mediaId);
      return next;
    });
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId }),
      });
      if (!res.ok) throw new Error("api error");
    } catch {
      if (prev !== undefined) {
        setArchiveMap((m) => new Map(m).set(mediaId, prev));
      }
    }
  }, []);

  const toggleFavourite = useCallback(async (mediaId: number, mediaType: string) => {
    const prev = mapRef.current.get(mediaId);
    const newFav = !(prev?.favourite ?? false);

    // Unfavourite a favourites-only row → remove it entirely
    if (!newFav && prev?.status === FAVOURITE_ONLY_STATUS) {
      await removeFromArchive(mediaId);
      return;
    }

    // New favourite with no tracker status → favourites-only row
    if (newFav && prev === undefined) {
      setArchiveMap((m) =>
        new Map(m).set(mediaId, { status: FAVOURITE_ONLY_STATUS, favourite: true })
      );
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId: mediaId,
            status: FAVOURITE_ONLY_STATUS,
            favourite: true,
            mediaType,
          }),
        });
        if (!res.ok) throw new Error("api error");
      } catch {
        setArchiveMap((m) => {
          const next = new Map(m);
          next.delete(mediaId);
          return next;
        });
      }
      return;
    }

    // Toggle favourite on an existing tracked entry
    setArchiveMap((m) =>
      new Map(m).set(mediaId, { status: prev!.status, favourite: newFav })
    );
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, favourite: newFav }),
      });
      if (!res.ok) throw new Error("api error");
    } catch {
      setArchiveMap((m) => new Map(m).set(mediaId, prev!));
    }
  }, [removeFromArchive]);

  return (
    <ArchiveContext.Provider
      value={{ isLoggedIn, archiveMap, addToArchive, updateStatus, removeFromArchive, toggleFavourite }}
    >
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchive(): ArchiveContextValue {
  return useContext(ArchiveContext);
}

export interface StatusColorDef {
  color: string;
  bg: string;
  border: string;
}

export const STATUS_COLORS: Record<string, StatusColorDef> = {
  IN_PROGRESS: { color: "#1d9e75", bg: "rgba(29,158,117,0.2)",  border: "rgba(29,158,117,0.4)" },
  COMPLETED:   { color: "#534AB7", bg: "rgba(83,74,183,0.2)",   border: "rgba(83,74,183,0.4)" },
  PLANNED:     { color: "#5a5a65", bg: "rgba(90,90,101,0.15)",  border: "rgba(90,90,101,0.3)" },
  DROPPED:     { color: "#e8173f", bg: "rgba(232,23,63,0.15)",  border: "rgba(232,23,63,0.3)" },
  ON_HOLD:     { color: "#BA7517", bg: "rgba(186,117,23,0.15)", border: "rgba(186,117,23,0.3)" },
};

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "WATCHING",
  COMPLETED:   "COMPLETED",
  PLANNED:     "PLANNED",
  DROPPED:     "DROPPED",
  ON_HOLD:     "ON HOLD",
};
