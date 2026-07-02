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
  favouriteIds: Set<number>;
  addToArchive: (mediaId: number, mediaType: string, status?: string) => Promise<void>;
  updateStatus: (mediaId: number, status: string) => Promise<void>;
  removeFromArchive: (mediaId: number) => Promise<void>;
  toggleFavourite: (mediaId: number, mediaType: string) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue>({
  isLoggedIn: false,
  archiveMap: new Map(),
  favouriteIds: new Set(),
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
  const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

  // Refs always hold latest values — lets callbacks avoid stale closures
  const mapRef = useRef(archiveMap);
  useEffect(() => { mapRef.current = archiveMap; }, [archiveMap]);
  const favRef = useRef(favouriteIds);
  useEffect(() => { favRef.current = favouriteIds; }, [favouriteIds]);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      fetch("/api/archive/ids").then((r) => r.json() as Promise<{ entries: { id: number; status: string; favourite: boolean }[] }>),
      fetch("/api/favourites/ids").then((r) => r.json() as Promise<{ ids: number[] }>),
    ])
      .then(([archiveData, favData]) => {
        setArchiveMap(
          new Map(archiveData.entries.map((e) => [e.id, { status: e.status, favourite: e.favourite }]))
        );
        setFavouriteIds(new Set(favData.ids));
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
    const isFav = favRef.current.has(mediaId);
    const newFav = !isFav;

    // Optimistic update
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (newFav) next.add(mediaId);
      else next.delete(mediaId);
      return next;
    });

    try {
      if (newFav) {
        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        });
        if (!res.ok) throw new Error("api error");
      } else {
        const res = await fetch(`/api/favourites/${mediaId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("api error");
      }
    } catch {
      // Rollback
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(mediaId);
        else next.delete(mediaId);
        return next;
      });
    }
  }, []);

  return (
    <ArchiveContext.Provider
      value={{ isLoggedIn, archiveMap, favouriteIds, addToArchive, updateStatus, removeFromArchive, toggleFavourite }}
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
